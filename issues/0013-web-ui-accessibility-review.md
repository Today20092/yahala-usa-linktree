# Accessibility implementation and specification review

Reviewed 2026-11-05 against [the specification](0013-web-ui-accessibility.md), after three implementation agents completed their assigned work. Independent worker source review and parent inspection found no outstanding implementation gaps across A1–A14. Validation remains bounded below; this is not a WCAG conformance certification.

## Implemented outcomes

| Criteria | Review result |
| --- | --- |
| A1–A2 | State selection requires explicit navigation; browser Ctrl+wheel is preserved; failed map is inert/hidden; larger marker/zoom targets and focus styling. |
| A3–A4 | Story pagination announces visible counts and moves focus to newly added content; search has visible label, headings, specific links, concise announcements and duplicate-request protection. |
| A5–A6 | Shared controls/header wrap; shared skip link targets focusable main on all three routes. |
| A7–A9 | Paused/reduced-motion brands wrap; QR supports command semantics, Space, native modal focus and return; Stories has no-JS fallback. |
| A10 | Share has persistent visible status, duplicate guard, cancellation and manual recovery. |
| A11–A14 | Privacy/About foreground opacity removed; reach statistics use valid description lists; paused/reduced/focused story rows expose unique wrapping content. |

## Executed validation

- Production build passed after implementation. Existing Vite plugin deprecation warnings remain.
- UI consistency validator passed (48 files).
- Focused shell, share, bento and search accessibility scripts passed. Share exercises success, native cancellation, denied/unavailable clipboard and concurrent activation. Search exercises loading/duplicate, success, empty, error and retry using the extracted request handler, not the live service.
- Existing visited-map, Atlas polish, reach-chart, branded-document and motion-toggle checks passed. Some are source-contract checks; they do not establish assistive-technology behavior.
- Correct managed Astro server health returned `{"ok":true}`. Logs confirm local transcript availability endpoint returns 404, so conditional search is intentionally unavailable here.
- Axe-core 4.10.3 WCAG A/AA tag scan at actual 320 CSS px: Home and Stories initially passed after the main fixes; About identified an additional 3.49:1 CTA contrast defect, corrected as A14. Final direct-page scans of Home and About returned zero violations; About returned no incomplete rules. Earlier home privacy measured 3.13:1 before A11 and no longer fails the final scan.
- All three routes showed no horizontal document overflow in the 320px iframe checks. Final direct Home scan confirmed actual 320px; 200% root text plus simultaneous line-height/paragraph/letter/word spacing showed no document overflow or clipped sampled paragraph/button/h2/h3 elements.
- Shell worker browser check: About header and controls remained within 320px with enlarged text/spacing; paused home brand layout exposed all 16 unique brands and hid duplicates; QR opened with close-button focus and restored trigger focus on close.

## Limits and remaining manual checks

- Browser snapshots and later pagination evaluation timed out; final live pagination/final-batch focus is supported by implementation/source regression review, not a successful live browser interaction check. Filter Back behavior was preserved in source, not re-certified in browser.
- Width-changing multi-route final scan timed out. Desktop was inspected initially, but final 390px/768px/1280px matrix is incomplete. Narrow viewport tests do not replace actual 400% browser zoom.
- No screen reader, real mobile hardware, forced-colors or reduced-motion media emulation was available in this run. Reduced-motion/static behavior has source-contract coverage; no representative-user study was performed.
- Live search UI/error announcements and external media captions/audio descriptions were not evaluated end to end. The site links to third-party media rather than providing its own player.
- Automated scans do not cover every contrast/interaction state. No whole-site WCAG AA conformance claim is made. The specification remains open for the remaining manual verification, with all recommended implementation changes completed.
- Preserved existing unrelated working-tree changes. No deployment or push performed.
