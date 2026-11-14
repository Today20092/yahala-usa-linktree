# Partnership funnel

Partnership actions on Home and About, and the shared Contact navigation link, lead to `/contact`. That page offers video sponsorships, local business features, and story suggestions in one focused form. The old homepage contact anchor remains valid. QR sharing is a secondary homepage footer action.

The form reuses the shared Field, Textarea, Radio Group, Input, and Button primitives and existing Atlas tokens.

## Delivery setup

Set `partnership.email` in `src/data/site.yaml` to the receiving inbox and `partnership.turnstileSiteKey` to the public verification key. The Worker also needs its `EMAIL` binding and `TURNSTILE_SECRET`. The receiving address is chosen by the server, never by the visitor. Source configuration does not prove deployed delivery; verify receipt separately.

The owner selected form-only contact. There are no direct email, Instagram-message, email-draft, or copy-to-email alternatives in the contact flow. Social follow links elsewhere remain viewer destinations.

The form posts to `/api/partnership` after verification. It confirms a successful response, then clears the submitted fields. During sending it prevents duplicate activation. Validation, unavailable-service, verification, and network errors preserve the inquiry on the current page for retry. A blocked security check can be retried without discarding the fields. A network interruption can leave delivery uncertain; the UI explains that retrying may send it again.

The next step is review of the inquiry and an email reply to discuss fit. No response-time commitment is published. Unsent details are not persisted in the browser; keep the page open during recovery. Native dialog-method submission prevents unhydrated personal data from appearing in a GET URL.

## Saved requests

Each verified inquiry is also saved in D1 (`partnership_requests`, migration `0002`), in the same database as testimonials. The email remains the notification. A failed save never blocks the email. If the email fails after a successful save, the visitor still sees success, because the request is on the admin page. If both fail, the visitor is asked to retry.

Admins review requests at `/admin/requests`, behind the same Cloudflare Access application and policy as `/admin`, which covers `api/admin/requests` on both hostnames. Tabs list New, Replied and Archived. Admins can reply by email (a `mailto:` link with the subject filled in), mark replied, archive, restore and delete. Every status change can be undone from the toast. Delete asks for confirmation.

Retention: the daily scheduled job deletes archived requests 12 months after `archived_at`. Restoring a request clears `archived_at`. Requests that are never archived are kept. The contact form tells visitors their message is kept for up to 12 months after Ya Hala finishes with it. The preview Worker has no cron, so its cleanup does not run.

Migration `0002` was applied to the preview and production databases on November 14, 2026, before the code was merged. `npm run test:requests` covers the admin API, the Access gate and retention. `scripts/test-partnership-delivery.tsx` (run with `npx tsx`) covers save-and-email outcomes. `tests/accessibility/requests-admin.spec.ts` covers the page.

## Historical verification — earlier draft flow, November 5, 2026

The notes below describe the superseded email-draft implementation, not the current form-only behavior.

- Passed `npx --yes tsx scripts/test-partnership.tsx`: configured/blank-inbox server-rendered states, visible form with enabled preparation, required controls, explicit label associations, safe unhydrated submission method, delivery explanation, and direct email fallback.
- Passed `npm run check`: zero errors or warnings; two existing unused-code hints.
- Passed `npm run build` and `npm run validate:ui` after changes. Build reports missing optional local icon directory and large chunks.
- Passed `node scripts/test-share-accessibility.mjs` and `node scripts/test-accessible-shell.mjs`, including QR keyboard activation and modal focus return.
- Inspected built preview DOM at 1280px and 320px. Current unavailable-email state has no horizontal document overflow, a working Instagram destination, no data-entry controls, and a 40px layout gap. QR destination is `https://yahalausa.net/`.
- Tested text-spacing overrides at 320px without document overflow. This is not actual 400% browser zoom or complete 200% text-resize verification.
- Measured current light-state contact text contrast: ordinary copy approximately 7.4:1 and primary Instagram action approximately 4.77:1. The section uses shared Atlas foreground/background aliases to avoid a theme mismatch found during review.
- Claude Opus 5.5 performed a source critique. Addressed unavailable-email dead end, URL submission, long-draft recovery, radio names/descriptions, stale status, keyboard focus treatment, and obsolete QR CSS. Its missing-spacing-token claim was incorrect: the tokens are defined in root `tokens.css` and the rendered gap is 40px.

## Contact-page revision verification

### Primary action contrast correction

Reproduced the pale homepage action at the same Tailscale development URL used on the phone. Text contrast was 1.03:1. Tailwind’s `--color-accent` alias resolved to the pale shadcn accent surface, and the partnership token bridge incorrectly reused that name for the primary action. Added an independent `--brand-action` palette token and mapped `--primary` to it, preserving the intended brand colors. Measured resting action text contrast after the fix at 4.79:1 in both light and dark class states at 390px. UI validation, production build, and the partnership regression passed. Android Brave itself was not automated.

- Passed the type check, UI consistency check, navigation regression, branded-document regression, and four-route production build.
- In the built contact page, verified that empty required fields fail native validation and a completed test inquiry passes; preparing it produces the expected copyable text and status without changing the URL or sending anything. All five fields have associated visible labels.
- At 1280px the form uses two columns beside its introduction; at 320px it uses one column, with no horizontal overflow or clipped input, textarea, or button. The same controls remain within the viewport with 200% root font sizing plus simultaneous text-spacing overrides.
- The contact route is included in the sitemap and shared-layout checks.

Browser screenshot capture timed out. Configured email-client handoff, clipboard permissions, assistive technology, forced colors, actual browser zoom, real devices, and a complete WCAG evaluation remain unverified. No production or development Worker deployment was performed.
