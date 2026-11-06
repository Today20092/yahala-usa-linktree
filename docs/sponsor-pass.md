# Sponsor-first content pass

Implemented November 5, 2026, against the existing working tree. The current layout and unrelated work were preserved. No commit, push, Cloudflare deployment, packages, prices, translation system, or unapproved testimonial publication was part of this pass.

## Changes

- Home retains its section order. The desktop cover is capped at 52rem, the introduction connects stories to businesses, the partnership action uses the shared Button treatment, and the overlapping topic-card block was removed. Watch, Follow, story search, geographic discovery, and the story grid remain available.
- About introduces the existing accounting, management, and consulting background earlier and adds a partnership action beside the existing viewer actions. The personal journey and community mission remain intact.
- Home's most-viewed episodes now use the same dated, approximate public-view snapshot as About. The lifetime combined-channel total retains its separate date and its non-unique-viewer qualification.
- Curated Lipari Foods and King Chicken display titles live in `src/data/story-titles.json`, separately from generated YouTube metadata, and apply through the shared video resolver. Original source titles are retained in the cache.
- Corrected Orlando's story assignment from New York to Orlando, Florida, based on its cached description of the tour. Corrected Abu Sateef from Columbus, Indiana, to Columbus, Ohio, based on its title and description. Existing assignment preservation in the refresh script retains these corrections.
- Contact explains inquiry review and email follow-up. Its only inquiry path is the form. Direct email links, Instagram messaging links, email-app drafts, and copy-to-email fallback were removed from that flow. Social follow destinations elsewhere remain available for viewers.
- Delivery failures preserve the entered fields, remain on the page, and explain retry. A blocked security check can be retried without discarding the inquiry. Sending prevents editing the in-flight inquiry and duplicate activation. Successful responses clear the submitted fields. Unconfirmed network or malformed-response delivery is described as uncertain, including the possibility of a duplicate on retry. A no-JavaScript notice explains the prerequisite.
- `tsconfig.json` excludes generated browser artifacts and build output: the checker was otherwise parsing bundled trace-report JavaScript as application source.
- Testimonial collection guidance is in [testimonial-interviews.md](testimonial-interviews.md). It covers owner-led accounts, original feature links, evidence, dates, approval, translation, and the distinction between reported business outcomes and measured content results.

## Executed verification

Local environment: Windows, Node 26.3.0. CI's Node 22 environment and remote CI were not run.

- `npm ci`: passed after stopping the managed development and preview servers that held Windows native-module locks. Both servers were restored afterward.
- `npm run check`: passed, zero errors and warnings, two existing unused-code hints.
- `npm run build`: passed for all four routes. Existing optional local-icon-directory and large-chunk warnings remain.
- `npm run lint:a11y`, `npm run validate:ui`, and `npm run validate:data`: passed. Data validation still reports existing missing-location/state-only informational notices.
- `npx --yes tsx scripts/test-partnership.tsx` and `npx --yes tsx scripts/test-partnership-delivery.tsx`: passed, including server validation, honeypot, verification, destination control, and delivery failure behavior.
- `npm run test:a11y:full`: all 48 tests passed in 41.8 seconds across six viewport/color-preference configurations, including 320px reflow. Tests cover required fields, keyboard choices/focus, field preservation, service/validation/verification/network failures, security-script retry, sending feedback, duplicate activation, success reset, enlarged text/spacing, forced-colors visibility, curated titles, corrected locations, consistent view proof, QR keyboard/focus behavior, and reduced motion on the current story cards. Verification and delivery are mocked; no real email is sent.
- Focused regressions passed: `test:visited-map`, `test:youtube-catalog`, `test:site-navigation`, `test:preview-smoke`, `test:reach-chart`, `test:atlas-polish`, `test:story-coverage`, `test:editorial-motion`, `test:video-recency`, `test:branded-document`, and `test:accessibility`.
- Mechanical design detector over pages/components returned `[]`. Source whitespace check passed.
- Inspected rendered screenshots of Home at mobile and desktop widths, mobile Contact, and desktop About. The form error text and homepage action hover initially failed rendered contrast checks; both were corrected before the passing run.
- Managed development readiness returned HTTP 200 with `{"ok":true}` on localhost and the Tailscale address. All four built-preview routes returned HTTP 200. Development and preview logs were inspected.
- `npm run smoke:preview -- dist` and `npm run smoke:preview -- http://localhost:4322`: passed for nine built assets and expected page journeys. CSP is not applied by the local static preview; the Cloudflare Worker supplies deployment headers separately.

## Remaining limits

Production delivery and actual inbox receipt were not tested. The local development server does not emulate the Worker's email bindings; verification domain restrictions can prevent real local submission. Browser mocks prove interface behavior, not Cloudflare delivery. Keep the page open during retry because inquiry drafts are not persisted.

Axe incomplete results remain for gradient/overlapping text contrast, radio naming that references visible labels/descriptions, and the QR dialog relationship. Existing names/references and rendered QR keyboard behavior were checked; screen-reader evaluation, physical devices, actual 400% browser zoom, and guided manual accessibility assessment remain unverified. Automated passes do not establish full WCAG conformance.

Owner recordings, permissions, approved translations, and supporting business-outcome evidence still need collection before testimonials can appear publicly. No anecdote from the conversation was converted into a published quote or sales guarantee.

Local preview: http://localhost:4322. Development server: http://localhost:4321, also available through the existing Tailscale address.
