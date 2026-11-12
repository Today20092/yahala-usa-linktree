---
status: open
triage: ready-for-human
branch: codex/production-testimonials
---

# Complete the live testimonial approval flow

## Context

The bilingual testimonial form and email approval flow have been merged and tested with a preview database. The live site needs its own database connection and a real end-to-end verification before Ya Hala can reliably invite clients to submit testimonials. The approval inbox is the same inbox used by the contact form.

## What to build

Make the complete live flow work: Ya Hala sends a client a shareable link, the client submits a testimonial in English or Arabic, and Ya Hala approves or rejects it from an email. An approved testimonial appears automatically in the site's testimonial carousel; a rejected testimonial does not appear.

## Branch strategy

Implement this single end-to-end ticket on `codex/production-testimonials`, based on current `main`. Follow the repository's production deployment and release workflow. Coordinate any account access needed without exposing credentials.

## Acceptance criteria

- [x] Provision a dedicated production testimonial database, apply its schema, and connect it to the live Worker without sharing preview data or changing existing production data.
- [x] Deploy the completed configuration and feature to the live website through the authorized production workflow. Preserve the existing contact form and its email and security settings.
- [x] Verify the live bilingual form at a stable, copyable URL that can be sent to a client. It accepts valid submissions and retains text on recoverable errors. Confirm its indexing and access behavior match the existing shareable, noindex form.
- [ ] A real end-to-end test submission reaches the contact form's configured approval inbox. Confirm actual inbox delivery and that the email links lead to the live review page.
- [ ] Opening an email link alone does not decide the testimonial. Confirming approval publishes the actual name, optional role, rating, and quote in the live carousel without manual editing; it remains visible after refresh.
- [x] A separate test rejection never appears publicly. Pending submissions remain private; expired, altered, and already-used review links cannot publish or change a decision.
- [x] Test mobile and desktop use, English and Arabic text, required consent and rating, and the live security check. Run relevant automated checks and document production configuration, verification, and any recovery steps.
- [x] Remove or reject test testimonials after verification so no test content remains on the live site. Provide the final client-facing URL and confirm the real approval and rejection results.

## Dependencies

None (can start immediately).

## Implementation progress — November 12, 2026

- Production deployment and merging the configuration PR were explicitly
  authorized for this ticket.
- Created `yahala-testimonials-production` in the pinned Haithum account:
  `eaf71968-c29c-4594-9fd2-1b46e60135b9`. Applied `0001_testimonials.sql` remotely.
  Preview remains on its separate database; existing production data is untouched.
- Added the production binding and pinned account in `wrangler.jsonc`.
  Existing email, Turnstile secret, search bindings and routes are preserved.
- Backend testimonial regression checks, branch workflow checks, Astro type
  checking and production build passed locally.
- Inbox confirmation is pending: the owner cannot check the approval inbox
  during this session. Keep the ticket open until actual delivery and the
  email-link approval/rejection results are confirmed.

## Production verification — November 12, 2026

- [PR 82](https://github.com/Today20092/yahala-usa-linktree/pull/82) merged as
  `022dc4d25f00061d1cacb3424f5fe72398d8abf0`.
  [Deploy](https://github.com/Today20092/yahala-usa-linktree/actions/runs/43307075878)
  succeeded. Live settings confirm the dedicated production D1 binding and all
  existing email, security and search bindings.
- Client URL: <https://yahalausa.net/testimonial/>. The API changed from HTTP 503
  to HTTP 200. The form remains public and `noindex`; review is `noindex,
  nofollow` with `no-referrer` and clears its credential fragment.
- Submitted a clearly labeled bilingual technical test through the actual live
  form with real Turnstile. It showed success and persisted a pending row,
  confirming acceptance by the existing email sending binding. This does not
  prove inbox delivery.
- Separately inserted three controlled D1 fixtures to verify live review without
  inbox access. Opening the approval link left its row pending. Confirmation
  approved it; its actual name, role, five-star rating and bilingual quote
  appeared in the live homepage carousel and survived refresh. Rejection of the
  other fixture stayed private. Expired, altered, and used credentials returned
  HTTP 410. These fixture checks do not substitute for clicking the real email.
- At 320px and 1280px, live form/review/carousel checks had no horizontal
  overflow. Existing rendered tests cover required consent/rating and preserved
  text after recoverable errors; backend tests cover validation and send failure.
- Deleted all four exact verification IDs. The public API returns an empty list
  and the refreshed homepage hides the carousel. No test content remains live.
- Owner explicitly deferred actual inbox delivery and real email-link checks.
  Production setup is operational; the ticket remains open only for that human
  verification. Send a fresh test when resuming: all prior test links are now
  invalid because their records were removed.
