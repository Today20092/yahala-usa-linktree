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

There is no admin password, dashboard or public moderation API. To remove a
published quote, change its D1 row to `rejected` in Cloudflare's authenticated
database console. Expired pending links require a fresh submission. D1 records
are retained until manually deleted; delete rejected/expired records when they
are no longer needed. If requesting the approval email fails, the pending row
is removed and the client sees a retry message with their text preserved.

Production is not provisioned by the preview setup. Before a separately
authorized production release, add a dedicated production `TESTIMONIALS_DB`
binding, apply the same migration there, and verify real email delivery and
approval. Never share the preview database with production.

## Verification

`npm run test:testimonials` uses in-memory SQLite and a mocked email/Turnstile
boundary. Rendered tests in `tests/accessibility/testimonials.spec.ts` cover the
bilingual form, recovery, review confirmation, and the approved carousel.
They send no real emails and do not publish client quotes.

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
