# Partnership funnel

The homepage ends with “Your story. Your brand. Our next stop.” and a “Let’s work together” link to `/contact`. That page offers video sponsorships, local business features, and story suggestions in one focused form. The header’s Contact link and the About page’s partnership link also lead there. The old homepage contact anchor remains a valid destination for existing links. QR sharing is a secondary homepage footer action.

The form reuses Cnippet Field, Textarea, and Radio Group, plus the existing shadcn Input and Button. Shared Atlas token mappings apply to the contact section in both theme states.

## Delivery setup

Set `partnership.email` in `src/data/site.yaml` to the intended receiving inbox. The owner requested that it stay empty for now while the complete form remains visible and usable. Preparing an inquiry creates copyable text; it does not navigate to an unaddressed mailto link. Availability is explained before the fields, and Instagram remains a working alternative. No email delivery provider is configured.

The implemented email flow prepares a draft in the visitor’s email app; it does not send automatically. The visitor reviews and sends it. Long encoded drafts remain available to copy, with a direct email link. Entered details are not saved on the site. Native dialog-method submission prevents an unhydrated form from putting personal data in a GET URL.

The receiving inbox is intentionally blank. Do not describe this as a deployed direct-send form.

## Verification — November 5, 2026

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
