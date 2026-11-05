---
status: open
triage: ready-for-agent
branch: perf/right-size-island-hydration
---

# Web UI accessibility review and implementation specification

## Context

Audit/find followed by implement/change, targeting WCAG 2.2 AA. Scope: `/`, `/about`, `/stories`, shared shell, QR dialog, moving story/brand rows, map/state navigation, story filters/pagination and conditional transcript search. Preserve the Atlas identity, semantic tokens, data meanings and existing work.

References: project tokens/components; web-ui-accessibility skill accessibility, layout-data and consistency references; WCAG 2.2 and WAI disclosure/dialog patterns. These are evaluation targets, not a conformance declaration.

## Branch strategy

Use current `perf/right-size-island-hydration`; workers share this checkout with distinct ownership. Preserve preexisting uncommitted work. No deployment requested.

## Findings and acceptance criteria

Each item identifies source evidence, user effect and the narrow required correction.

- [ ] A1: `VisitedPlacesExplorer.tsx` navigates on select change without instruction (3.2.2). Select a state without navigation, then activate an explicit descriptive browse action.
- [ ] A2: `VisitedPlacesLeafletMap.tsx` intercepts Ctrl+wheel, blocking browser zoom (1.4.4). Remove interception; retain ordinary map interactions. Error overlay must remove obscured map controls from keyboard navigation (2.4.11). Provide generous marker targets or equivalent accessible navigation. Verify existing map tests after behavior changes.
- [ ] A3: `StoryBrowser.tsx` final Load more removes the focused button; unchanged total does not announce appended items. Announce visible/total count and preserve useful focus after explicit pagination, including final batch. Filters, empty state and Back continue working.
- [ ] A4: `VideoSearch.tsx` has hidden-only label, generic repeated watch labels, non-heading titles and an excessively broad live region. Provide visible associated label, semantic section/result headings, result-specific links, concise status announcements, duplicate request handling and preserved query/error recovery. Test loading, empty, error and success; mark service-dependent states unavailable when not configured.
- [ ] A5: `atlas.css` forces links/buttons nowrap while clipping page overflow; EditorialHeader has an inflexible row. Permit long labels and header wrapping at 320px, 200% text and simultaneous text spacing without losing controls.
- [ ] A6: About/Stories repeated header has no bypass link or main target. Add a shared keyboard-visible skip link with valid focus destination.
- [ ] A7: BrandMarquee paused/reduced-motion track remains clipped with unreachable logos. Show the complete unique brand content in a wrapping static layout when paused or reduced motion is active; hide duplicate content.
- [ ] A8: QR anchors execute open/close commands. Enhance to button semantics while preserving no-JS destination fallback and native modal focus, Escape and return focus.
- [ ] A9: Stories uses client-only rendering without a no-JS explanation. Provide a useful fallback and direct channel destination; this is a usability recommendation, not an asserted WCAG failure.
- [ ] A10: Home share changes its accessible label briefly without persistent visible outcome. Provide visible concise live status for copy success/failure and prevent repeated concurrent activation; preserve native share cancellation.

## Validation and review

Implementation review: A1–A14 completed. See [results and remaining manual checks](0013-web-ui-accessibility-review.md). Checkboxes remain open until the full requested validation matrix can be completed; they do not indicate missing implementation.

- [ ] A13: `VideoBentoGrid.astro` freezes a clipped max-content track when paused and retains clipping under reduced motion, preventing access to offscreen stories. Show unique content in a wrapping static layout when paused, reduced motion or keyboard focus is within the rows; hide duplicates. Remove redundant generic-div metric labels and opacity from latest-video date copy.

- [ ] A11: Rendered axe home audit measures privacy copy at 3.13:1 (#928c88 on #f8f8fc, 11.2px). Remove its opacity modifier and verify the rendered ordinary-text pair reaches 4.5:1.
- [ ] A12: Rendered axe identifies invalid definition-list nesting in ReachBadge: dt/dd are nested two divs below dl. Make each stat row a valid dl with direct dt/dd children, preserving layout and decorative bars outside the dl.

- [ ] A14: Rendered axe About audit measures CTA eyebrow at 3.49:1 (#f8d4d9 on #db2940, 14px bold). Remove foreground opacity and verify ordinary-text contrast reaches 4.5:1.

Inventory all three routes; inspect desktop, 320px, phone and intermediate widths; text spacing and enlarged text; keyboard focus/dialog/pagination; motion/forced colors where supported. Measure actual rendered contrast where possible. Run build, UI consistency checks and relevant regression tests. Record actual executed results separately from unavailable screen-reader, real mobile, browser zoom and service-dependent checks. Review final implementation against every A item after workers finish. Existing source token tests do not substitute for rendered contrast or assistive-technology testing.

## Dependencies

None. Initial browser localhost resolved to another project; use the verified LAN-hosted Ya Hala managed Astro server for browser evidence.
