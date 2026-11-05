---
status: open
triage: needs-info
branch: feature/site-form-actions
---

# 11 — Use Astro Actions for the first site-owned form

## Context

Ya Hala does not currently have a contact, RSVP, subscription, or submission
workflow. When one is approved, Astro Actions should be evaluated before adding a
handwritten internal API route because Actions provide the site's UI with typed
server calls, input validation, form handling, and standardized errors.

This ticket does not authorize building a speculative form or changing the current
static deployment. The chosen workflow must first define its fields, destination,
privacy requirements, abuse controls, and success/failure experience.

## Branch strategy

When a form requirement is approved, implement it on `feature/site-form-actions`.
Keep the UI, Action, validation, Cloudflare runtime configuration, and focused
tests together because none is useful independently. A public API contract belongs
on a separate endpoint branch instead.

## Acceptance criteria

- [ ] Record the approved workflow, data fields, delivery/storage destination,
      retention expectations, and user-facing states.
- [ ] Confirm that an Astro Action is a better fit than a public endpoint for the
      workflow.
- [ ] Add only the server adapter and Cloudflare configuration required to execute
      the Action in the existing deployment.
- [ ] Validate all untrusted input on the server and add appropriate spam/abuse
      protection.
- [ ] Provide accessible pending, success, validation-error, and server-error
      states without losing user input unnecessarily.
- [ ] Keep secrets server-only and avoid logging submitted personal information.
- [ ] Add one focused success-path check and representative validation/failure
      checks, then run the production build.

## Dependencies

Waiting for an approved site-owned form workflow and its data-handling requirements.
