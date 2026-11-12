---
status: open
triage: ready-for-agent
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

- [ ] Provision a dedicated production testimonial database, apply its schema, and connect it to the live Worker without sharing preview data or changing existing production data.
- [ ] Deploy the completed configuration and feature to the live website through the authorized production workflow. Preserve the existing contact form and its email and security settings.
- [ ] Verify the live bilingual form at a stable, copyable URL that can be sent to a client. It accepts valid submissions and retains text on recoverable errors. Confirm its indexing and access behavior match the existing shareable, noindex form.
- [ ] A real end-to-end test submission reaches the contact form's configured approval inbox. Confirm actual inbox delivery and that the email links lead to the live review page.
- [ ] Opening an email link alone does not decide the testimonial. Confirming approval publishes the actual name, optional role, rating, and quote in the live carousel without manual editing; it remains visible after refresh.
- [ ] A separate test rejection never appears publicly. Pending submissions remain private; expired, altered, and already-used review links cannot publish or change a decision.
- [ ] Test mobile and desktop use, English and Arabic text, required consent and rating, and the live security check. Run relevant automated checks and document production configuration, verification, and any recovery steps.
- [ ] Remove or reject test testimonials after verification so no test content remains on the live site. Provide the final client-facing URL and confirm the real approval and rejection results.

## Dependencies

None (can start immediately).
