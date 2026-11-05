# Motion accessibility review

Reviewed November 5, 2026 using the `web-ui-accessibility` skill. Scope: the new text reveals on `/`, `/about`, and `/stories`, About scroll entrances, and their pause behavior. References: `docs/ui-consistency.md`, existing motion controls, WCAG 2.2 AA as a target, and [Cnippet Text Reveal](https://ui.cnippet.dev/motion/text-animations/text-reveal) / [Scroll Reveal](https://ui.cnippet.dev/motion/scroll-animations/scroll-reveal).

## Findings

- **Fixed:** scoped animation CSS could override Pause motion. The shared TextReveal pause selector now overrides both presets; browser computed styles confirm opacity 1 and animation none when paused. The homepage control also reveals existing section entrances immediately through the Atlas shared stylesheet.
- **Existing theme defect:** manually forcing `html.dark` on Home/About changes heading foreground to near white while Atlas retains its light `--color-paper` background. Home's measured pair was approximately 1.01:1, below the 3:1 large-text minimum. Reproduce by adding `.dark` to the root and inspecting the main headline. Resolve the shared foreground/paper token mismatch before treating dark mode as supported. The animation component inherits these existing colors; this change does not repair the palette.

## Executed checks

- `npm run check`: zero errors/warnings, two unused-symbol hints outside the change.
- `npm run validate:ui`: passed.
- `npm run test:motion-toggle`: passed, including new observer tests for once-only entrances, reduced-motion and missing-IntersectionObserver fallbacks, and accessible text markup.
- `npm run test:accessibility`, `npm run test:site-navigation`, `npm run test:branded-document`: passed.
- `npm run build`: passed. Existing missing icon-directory and large-chunk notices remain.
- Managed production preview returned HTTP 200 with 3, 3, and 1 text-reveal instances on Home, About, and Stories respectively.
- Browser DOM/computed-style checks: Home/About at 320, 390, 768, and 1280 CSS px had no document overflow; Stories checked at 320 and 1280. All new text/scroll content was fully visible when paused.
- At 320 CSS px, all three routes tolerated 200% root text size together with line height 1.5, paragraph spacing 2em, letter spacing .12em and word spacing .16em without document overflow or new words crossing the viewport edge. Focused pause buttons were visible and retained focus after activation.
- Light Home heading contrast measured approximately 18.65:1 from computed foreground/background colors.
- `git diff --check`: passed.

## Coverage limits

Browser snapshots timed out twice; the alternate browser host was unavailable. IntersectionObserver callbacks did not fire in that preview session, so smoothness and real scrolling playback remain visually unverified; observer behavior was exercised with mocks. Reduced motion was checked through script branches and CSS inspection, not OS preference emulation. No actual screen-reader, forced-colors, real-device, full contrast audit, keyboard traversal, or 400% browser-zoom evaluation was completed. DOM focus checks are not a substitute for keyboard or assistive-technology testing. This is a focused review, not a WCAG conformance claim.
