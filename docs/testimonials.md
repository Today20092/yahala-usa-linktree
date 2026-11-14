# Client testimonials

Send clients `/testimonial`. The form is bilingual, accepts English or Arabic,
and requires a real rating and permission to publish. Name, optional business/role,
quote, rating and consent time are stored in Cloudflare D1. It does not collect
an email address or publish pending submissions.

The receiving inbox comes from `partnership.email` in `src/data/site.yaml`, the
same configuration as the contact form. The Worker uses its existing `EMAIL`
binding, verified sender `partnerships@yahalausa.net`, and `TURNSTILE_SECRET`.
No review password is needed.

Each submission sends an email containing Approve and Reject links. Open a link,
read the quote, and confirm the decision. Opening the email link alone never
publishes anything. The review credential lives in the URL fragment, is removed
from the address bar on load, is stored only as a SHA-256 hash in D1, expires
after 14 days, and is invalidated after a decision. Do not forward review emails.
After refreshing a review page, reopen the original email link.

Approved testimonials appear automatically immediately before the homepage
partnership CTA, in the carousel based on the supplied Cnippet example. The
section stays hidden until there is at least one approved quote. The public API
returns only public fields from approved rows, with a maximum of 60 quotes.
Pending and rejected submissions remain private in D1.

## Component sources

The collection page composes Cnippet Form, Rating, Checkbox, Alert and Spinner
with the shared Base UI Field, Input, Textarea and Button components. The form
layout follows the Cnippet feedback-with-rating pattern, while retaining real
Cloudflare submission, publication consent and bilingual copy. Rating uses
Ya Hala primary colors, bilingual labels and 44px touch targets. Textarea adds
a live character count without replacing the shared control.

The approved carousel adapts the supplied Cnippet testimonial example using
shared Card, Avatar and Embla Carousel components. Cnippet is source copied into
this repository, not a hosted form or approval service.

Reviewed relevant catalog categories: Form, Rating, Field/Fieldset, Input,
Textarea, Checkbox, Button, Alert, Spinner, Card, Avatar and Carousel. Multi-step
wizards, uploads, toast-only feedback, charts and unrelated account forms add
no value to this short testimonial flow and were not added.

Sources: [Form](https://ui.cnippet.dev/ui/forms/form),
[Rating](https://ui.cnippet.dev/explore?category=rating),
[Carousel](https://ui.cnippet.dev/explore?category=carousel).

## Development setup

Use the pinned Haithum account and `wrangler.preview.jsonc`. Never provision
these resources in the Ayoub account. With a valid Cloudflare login:

```sh
npx wrangler d1 create yahala-testimonials-preview --binding TESTIMONIALS_DB --update-config --config wrangler.preview.jsonc
npx wrangler d1 migrations apply TESTIMONIALS_DB --remote --config wrangler.preview.jsonc
npm run build
npx wrangler deploy --config wrangler.preview.jsonc
```

If the database already exists, bind its ID instead of creating another one.
Verify the existing email sending domain, destination permissions and Turnstile
secret before sharing the form. Turnstile must allow the preview hostname.
The success message means the database write and email send request succeeded;
actual inbox delivery still needs an end-to-end check.

For local schema/runtime checks use `d1 migrations apply ... --local` and
`wrangler dev --config wrangler.preview.jsonc`. Astro dev/preview alone does not
provide Worker API bindings. Never put real review links or client details in
test fixtures or logs.

## Operations

Manage testimonials at `/admin`. Tabs list Pending, Published and Hidden
(`rejected` in D1) quotes. Admins can publish, hide, republish or permanently
delete a quote, including pending quotes whose email link has expired. An admin
decision clears the emailed review credential. Hide and republish can be undone
from the confirmation toast; delete asks for confirmation and cannot be undone.
Admins cannot edit a client's words. Each change is logged with the admin's
Access identity in Worker logs. If requesting the approval email fails, the
pending row is removed and the client sees a retry message with their text
preserved.

### Cloudflare Access for the admin page

The page and `GET`/`POST /api/admin/testimonials` are protected by Cloudflare
Access. There is no site password. Set this up once per Worker hostname in
Cloudflare Zero Trust:

1. Under Access → Applications, add a **self-hosted** application for
   `yahalausa.net` with the paths `admin`, `api/admin/testimonials` and `api/admin/requests`. Do not
   protect all of `api/admin`. The video-search admin endpoints use their own
   bearer token and must stay reachable by scripts. Add the preview Worker
   hostname as a separate application or destination when testing there.
2. Add an Allow policy that lists the admins' email addresses, using One-time
   PIN or Google sign-in.
3. Put the team URL and the application's **Audience (AUD) tag** in the `vars`
   of `wrangler.jsonc` and `wrangler.preview.jsonc` as `ACCESS_TEAM_DOMAIN` and
   `ACCESS_AUD`. Both are public identifiers, not secrets, so they deploy with
   the code. Do not also store them as Worker secrets with the same names.

**Configured November 14, 2026** in the pinned Haithum account: Zero Trust team
`yahalausa.cloudflareaccess.com`, One-time PIN login, reusable policy
`YaHala admins` (allows `yahalaflorida@gmail.com` and
`ayoub.abedrabbo@gmail.com`), and the self-hosted
application `YaHala admin` covering those paths on `yahalausa.net` and on the
preview Worker hostname. Add admins by editing that policy. Both Wrangler
configs carry the application's values, so preview and production deploys need
no extra step.

The Worker verifies the signed `Cf-Access-Jwt-Assertion` against the team's
public keys, issuer, audience and expiry before reading or changing any rows.
Until both values are set, the admin API returns 401. A missing or
misconfigured Access application therefore fails closed. The page itself holds
no data. `astro dev` shows labelled sample data because it does not run the
Worker; production builds exclude that sample module.

## Production setup

Production uses `yahala-testimonials-production`
(`eaf71968-c29c-4594-9fd2-1b46e60135b9`) in the pinned Haithum account,
bound as `TESTIMONIALS_DB` in `wrangler.jsonc`. It is separate from preview.
Migration `0001_testimonials.sql` was applied remotely on November 12, 2026,
before the binding was deployed. No existing production database was changed.

For future schema changes, apply reviewed migrations to the production database
before merging code that requires them:

```sh
npx wrangler d1 migrations apply yahala-testimonials-production --remote --config wrangler.jsonc
```

Merge the verified configuration PR into `main`; the existing Deploy workflow
builds and deploys the live Worker. Preserve the existing email binding,
Turnstile secret and search resources. The client-facing form is
<https://yahalausa.net/testimonial/>. A successful submission confirms D1 storage
and acceptance by the email sending binding, not actual inbox delivery.

If deployment fails, fix and rerun the Deploy workflow from `main`. To disable
the feature, revert the binding change through a PR; retain the database for
recovery. A Worker rollback does not roll back D1. Do not delete the database or
replace it with preview. Remove verification records by their exact test IDs;
never clear the testimonials table.

Configuration and migration reference:
[Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

## Verification

`npm run test:testimonials` uses in-memory SQLite and a mocked email/Turnstile
boundary. Rendered tests in `tests/accessibility/testimonials.spec.ts` cover the
bilingual form, recovery, review confirmation, and the approved carousel.
`tests/accessibility/testimonial-admin.spec.ts` covers admin moderation, undo,
delete confirmation, keyboard tabs and the signed-out state against a mocked
admin API. They send no real emails and do not publish client quotes.

### Verification on November 12, 2026

- Backend checks passed with real in-memory SQLite and mocked email/Turnstile.
- All 24 source/type/data/regression commands passed; build, UI consistency,
  accessibility lint, local D1 migration, Worker types and dry-run packaging passed.
- The full 102-case rendered matrix passed before the final attribution and
  shared-control adjustments. All 10 focused rendered cases passed afterward,
  including accepted maximum-length names/businesses at 320px and 1280px.
- The final scoped reviewer marked the attribution correction resolved and
  returned ship. Design comparison confirmed the incumbent system is preserved.
- Local Worker runtime returned an empty approved list, rejected a tampered
  review credential, and returned unavailable for an unconfigured submission.
- Preview D1 database `yahala-testimonials-preview` was provisioned and migration
  `0001_testimonials.sql` applied in the pinned Haithum account.
- Built and deployed preview Worker version `66125b61-d8a0-407b-a5e7-812e10681c19`.
  The form and review pages returned HTTP 200; the approved API returned an empty
  list with HTTP 200. No client submissions or test quotes were inserted.
- Real inbox delivery, Turnstile on the preview hostname, and deployed approval
  still require an end-to-end submission. Local Turnstile rejects localhost;
  browser tests mock verification and send no real email. Production is unchanged.

### Cnippet form update on November 12, 2026

- Installed Cnippet Form, Rating, Checkbox, Alert and Spinner from its registry.
  Reused existing fields, input, textarea, button, avatar, card and carousel.
- Adapted rating colors to Ya Hala tokens, enlarged touch targets, added
  bilingual star labels, required field validation and a character counter.
- Build, type checking, accessibility lint, UI consistency and Base UI regression
  checks passed. All 10 focused rendered checks passed for mobile light and
  desktop dark, including keyboard star selection and required consent/rating.
- Tests mock email and Turnstile; real inbox delivery remains unverified.
- Published preview Worker version `cb627f23-7121-4db8-b22f-90959ba5eaf4`.
- Live browser check confirmed Cnippet form, five rating controls and checkbox,
  no horizontal overflow, preserved noindex, and a completed real Turnstile check
  enabling submission. No testimonial or email was sent during this check.

### Production rollout on November 12, 2026

- [PR 82](https://github.com/Today20092/yahala-usa-linktree/pull/82) merged and
  [production deployment](https://github.com/Today20092/yahala-usa-linktree/actions/runs/43307075878)
  succeeded. The live approved API returns HTTP 200 with the dedicated D1 binding.
- A real bilingual technical submission at <https://yahalausa.net/testimonial/>
  completed Turnstile and was stored pending; the email binding accepted its
  approval notification. Inbox delivery is deferred at the owner's request.
- Controlled database fixtures verified live confirmation-only approval,
  rejection, private pending/rejected records, expiry, altered credentials and
  replay protection. Approval appeared in the homepage carousel with all fields
  and survived refresh. Form/review/carousel checks at 320px and 1280px had no
  horizontal overflow. The form retains noindex; review also has nofollow,
  no-referrer, and removes the credential fragment.
- All four test records were deleted by exact ID. The live API is empty and the
  refreshed homepage hides the carousel. Old test email links are invalid;
  use a fresh submission for the deferred inbox and email-link verification.
- Passed locally: testimonial backend regression, branch workflow, Astro type
  check, build, built-asset smoke, UI consistency, deployment dry run and diff
  whitespace checks. No application code or email/security settings changed.
