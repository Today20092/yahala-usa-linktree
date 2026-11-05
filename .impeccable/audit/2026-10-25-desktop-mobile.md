# Desktop, mobile, and motion verification

Date: October 25, 2026. Target: current local development site and existing production build output.

## Implementation follow-up

Owner revision: the reduced-motion wrapping story grid was subsequently reverted to the original compact horizontal rows because it made the mobile section too tall. Pause controls and the other functional fixes remain.

The four findings below were implemented and verified locally on October 25:

- Search hydrates with `client:idle`, sends its availability request, and retains the readiness guard. Isolated browser API fixtures verified loading, empty results, Arabic RTL results with timestamp links, temporary failure, and retry. Real Worker-backed search remains a deployment integration check.
- QR uses a native modal dialog. Desktop and phone checks passed for forward/backward focus containment, Escape, close control, backdrop dismissal, and focus restoration.
- Brand and story sections have independent pause/resume controls. Story rows also pause on hover and keyboard focus. The new `test:motion-toggle` regression test passes.
- Reduced-motion story rows are static wrapping grids; all original cards fit horizontally at phone and desktop sizes. Duplicate groups remain hidden and redundant motion controls disappear under that preference.

Production build, preview smoke checks, existing motion/contrast and transcript tests, UI consistency validation, whitespace validation, and Impeccable's detector pass. The development preview is running; nothing was deployed. The original findings below remain as the audit history, not outstanding work.

## Result

The main viewing and location-browsing paths work after restarting a stale development server. Four issues remain: search never hydrates, QR focus escapes its modal, continuous motion lacks adequate pause controls, and reduced-motion video rows remain clipped.

This is a focused source and browser audit, not an accessibility certification or performance benchmark.

## Audit health

| Dimension | Score | Evidence |
|---|---:|---|
| Accessibility | 2/4 | QR modal focus and continuous-motion controls need work. |
| Performance | 3/4 | Lazy-loaded islands and existing optimized images; no timing benchmark run. |
| Theming | 3/4 | Existing light-theme contrast/token checks pass; alternate themes not tested. |
| Responsive design | 3/4 | No page overflow at tested widths; reduced-motion story access needs improvement. |
| Implementation integrity | 2/4 | Product-specific system is coherent, but search initialization is blocked. |
| **Total** | **13/20** | **Acceptable; functional and accessibility work remains.** |

## Verified issues

### P1: Video search never initializes

Location: `src/pages/index.astro:428`, `src/components/VideoSearch.tsx:119`.

The homepage applies `client:visible` to VideoSearch. Its initial render returns null until an availability request succeeds, and that request starts in a client effect. Browser inspection confirmed the island has zero child elements and retains its server-rendered marker after visiting the section. No availability request was observed. The installed Astro visibility directive only observes child elements, so there is no target to trigger hydration.

Recommendation: initialize the readiness check independently of visibility, while retaining the availability guard. Then verify available, unavailable, loading, empty, error, Arabic, and English search states against the Worker API. Local Astro development alone does not supply that Worker service.

Suggested command: `$impeccable harden`.

### P1: QR dialog does not contain keyboard focus

Location: `src/components/QrCodeButton.astro:65`, `:151`.

Opening the dialog focuses its close control. Two Tab presses move focus out into the underlying latest-story link while the modal remains open. Escape closes it and restores focus correctly, so those behaviors should be preserved.

Recommendation: use a native modal dialog or the project's established dialog behavior to contain focus and make the background inert. Test Tab, Shift+Tab, Escape, close, backdrop dismissal, and focus restoration.

Reference: WAI-ARIA modal-dialog keyboard interaction pattern. Suggested command: `$impeccable harden`.

### P1: Continuous marquees lack usable pause controls

Location: `src/components/VideoBentoGrid.astro:465`, `src/components/BrandMarquee.astro:89`.

Normal-motion brand and video track transforms changed between browser observations. Video animation continues while a story link inside it has keyboard focus. Brands pause on hover, but neither surface supplies a persistent visible pause control for keyboard or touch users.

Recommendation: provide a pause/resume control and pause moving story rows during focus and hover. This is about controlling the existing motion, rather than adding effects.

Reference: WCAG 2.2.2 Pause, Stop, Hide. Suggested command: `$impeccable animate`.

### P2: Reduced motion leaves video thumbnails clipped

Location: `src/components/VideoBentoGrid.astro:460`, `:496`.

Reduced-motion media emulation correctly stops all tested brand and video tracks and preserves the final total of 155,359,353 views. However, each phone video row retains approximately 2,080px of content inside a 323px container with `overflow: hidden` and `touch-action: pan-y`. The screenshot shows only the initial thumbnails and a partial next thumbnail. The stopped content has no visible way to reveal the remaining stories directly.

Recommendation: render a static wrapping selection or grid under reduced motion, with a clear path to all stories. Do not merely stop a clipped conveyor.

Suggested command: `$impeccable adapt`, followed by `$impeccable polish`.

## Passed checks

- Managed server health endpoint returned `{"ok":true}`.
- Tested layout at 1280px desktop, 768px tablet in the preceding refinement, and 390px and 320px phone widths. No document horizontal overflow was observed.
- Normal-motion brand and video marquees move; reduced-motion emulation stops both. Visible reveal sections remained visible on the narrow-phone check.
- Final view count and source statistics remain correct.
- QR opens at desktop and phone sizes; Escape and focus restoration work. Focus containment fails as noted above.
- After restarting the managed server, Leaflet and OpenStreetMap tiles load. State selection reaches the matching Story Browser on desktop and phone.
- Story Browser state, city, and oldest/newest sorting update the URL and results. Loading more Chicago stories increases rendered story links from 24 to 44. Browser Back restores the previous sort. An invalid shared state displays an empty state; Clear filters restores all 320 stories.
- About page renders without horizontal overflow or detected broken loaded images at phone and desktop widths. Its contact destination matches the homepage Instagram destination.
- Watch and contact link destinations were inspected; external video playback and sending messages were not exercised.
- `smoke:preview -- dist`, `test:preview-smoke`, `test:atlas-polish`, `test:visited-map`, `test:video-search`, `test:reach-chart`, `validate:ui`, and `git diff --check` pass.
- Impeccable detector over `src/pages` and `src/components`: zero findings. These behavioral issues are outside what that mechanical scan established.

## Maintenance performed

Updated the smoke check and its fixture to accept the approved story-first source order. It had retained the old stats-before-story assertion. Desktop visual ordering remains controlled by the existing responsive CSS.

Restarted the managed Astro server after observing a 504 Outdated Optimize Dep response for the icon dependency. A clean retest loaded the map and state selector successfully. The user preview was refreshed and the development server remains running. No new UI behavior was changed during this audit.

## Limitations

Browser engine checks used emulated viewport widths and reduced-motion media settings, with mouse and keyboard interaction. The in-app browser rejected synthesized touch gesture APIs, so real touch swipes, pinch gestures, and physical iOS/Android behavior were not validated. Native screen-reader speech, native sharing UI, external playback, offline/slow-network behavior, and deployed Worker search integration were not tested. Browser viewport and media overrides were restored and the temporary audit tab was closed. Context7 was unavailable due to quota; installed Astro runtime source confirmed visibility behavior.
