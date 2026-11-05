# Partnership accessibility review — November 5, 2026

Scope: homepage partnership invitation and `/contact`, including the form’s blank-inbox and prepared-inquiry states. Target: WCAG 2.2 AA. This is a bounded review, not a conformance certification or whole-site audit.

Reference: the invoked web-ui-accessibility skill and its accessibility, consistency, and layout references; `docs/ui-consistency.md`; shared Atlas tokens and shadcn/Cnippet primitives. The source code and rendered page, rather than prior validation, supplied evidence for this revision.

## Findings and changes

- **Fixed: primary hover text contrast.** The translucent primary background yielded approximately 4.26:1 text contrast in the contact form. Ordinary action text requires 4.5:1. The shared Button primary variant now mixes the primary color with the foreground instead of making the background translucent. The rendered equivalent treatment measured approximately 5.34:1 in both class states. Pointer-hover automation timed out, so this measurement used the same computed CSS treatment applied temporarily in the browser, not successful physical pointer automation.
- **Fixed: input/radio boundaries.** Decorative divider colors gave approximately 1.78–1.89:1 against their surfaces, below the 3:1 control-boundary target. The shared Atlas input token now uses the secondary ink color; decorative dividers retain their own token. Measured control-boundary contrast after the change was at least 4.21:1 across sampled light/dark states.
- **Reviewed uncertainty: radio labels.** axe returned three incomplete `aria-toggle-field-name` checks. Each radio explicitly names its visible title with `aria-labelledby` and references its separate description with `aria-describedby`. Those relationships match the intended names and descriptions. This is DOM evidence; actual screen-reader announcements remain unverified.

## Executed checks

- Ran axe-core **4.14.0** in the browser against the contact page’s main content with WCAG A/AA tags through 2.2: zero automatic violations, three incomplete radio-name checks. The color-contrast rule reported 31 passing nodes in the resting state. A prepared-inquiry state scan also reported zero violations before the final shared-color changes.
- Re-ran axe after the shared-color changes at 320px in the dark class state: zero automatic violations; the same three incomplete radio checks.
- Inspected controls and copy at desktop/1280px and 320px. At 320px no horizontal document overflow or clipped inputs, textareas, or buttons was observed, including with 200% root font sizing plus simultaneous text-spacing overrides.
- Tested blank-inbox form preparation with synthetic test details: native validation succeeded, the draft was available, the status accurately said nothing had been sent, and no delivery action was performed.
- Passed `npx --yes tsx scripts/test-partnership.tsx`, `npm run validate:ui`, `npm run test:accessibility`, and `npm run build` after the changes. The existing accessibility commands cover QR focus/keyboard seams, bento modes, search failure/recovery, and share feedback/duplicate activation; they do not constitute live screen-reader testing.

## Coverage limits

Physical pointer-hover automation timed out. Keyboard automation did not demonstrate a reliable focus/selection transition, so full keyboard operation is not claimed as passed. Intermediate-width resizing was requested but the measured viewport remained 320px; that coverage is unavailable. No actual 400% browser zoom, forced-colors or reduced-motion browser emulation, Android Brave device test, assistive-technology session, clipboard permission matrix, or configured email-client handoff was completed. Existing source checks for reduced-motion behavior passed as part of the accessibility suite. The intentionally blank inbox still prevents email sending.

## Free, open-source tooling to add next

- **Playwright + @axe-core/playwright:** reproducible browser scenarios and WCAG rule scans against the built site. Exercise each route, light/dark preferences, viewport sizes, validation, prepared drafts, dialogs, and failure states. Add explicit assertions for control boundaries, focus visibility, overflow, and action contrast rather than relying on axe alone. Fail CI on violations and review incomplete findings separately. This integration is recommended, not installed by this review.
- **Astro’s built-in Audit toolbar:** immediate development-time feedback on common accessibility/performance defects. It is a convenience check, not the CI gate.
- **Accessibility Insights for Web:** free open-source browser extension with automated FastPass checks, tab-stop inspection, and guided manual assessment. Its documented assessment targets WCAG 2.1 AA; supplement it with the skill’s WCAG 2.2 checks.
- **eslint-plugin-astro with jsx-a11y rules**, plus JSX rules for React islands: catches source-level semantics, labels, alt text, and ARIA mistakes early. Static linting cannot measure final rendered contrast.
- **Pa11y CI:** an alternative URL/sitemap scanner if a simpler route sweep is desired. Start with the Playwright/axe integration rather than installing overlapping runners immediately.

Sources: https://playwright.dev/docs/accessibility-testing ; https://docs.astro.build/en/guides/dev-toolbar/ ; https://accessibilityinsights.io/docs/web/overview/ ; https://ota-meshi.github.io/eslint-plugin-astro/user-guide/ ; https://github.com/pa11y/pa11y-ci

No new runtime or development dependencies were installed, and no deployment was performed. The temporary browser axe injection is not a persistent automated gate.
