---
status: closed
triage: ready-for-human
branch: perf/right-size-island-hydration
---

# 07 — Right-size React island hydration

## Context

The site currently uses `client:only="react"` for `StoryBrowser` and
`client:load` for `VisitedPlacesLeafletMap` and `VisitedPlacesExplorer`.
These directives eagerly download or entirely skip server rendering. Astro's
`client:visible` directive can defer noncritical islands until they approach the
viewport, but it must not delay controls users need immediately or break
browser-only libraries.

Trace each widget's render and interaction path before changing it. Keep the
smallest directive that preserves server output, loading behavior, accessibility,
and the current user experience.

## Branch strategy

Implement on `perf/right-size-island-hydration`. The three directives belong in
one branch because they share one performance question and should be measured and
regression-tested together.

## Acceptance criteria

- [x] Document whether each current `client:load` and `client:only` island can
      safely use `client:visible`, with evidence from its code path and runtime
      behavior.
- [x] Change only directives whose hydration can be deferred without delaying an
      initially visible control or breaking a browser-only dependency.
- [x] Use an appropriate `rootMargin` when an island should begin loading shortly
      before entering the viewport.
- [x] Preserve useful server-rendered fallback content wherever the underlying
      library permits server rendering.
- [x] Verify the Stories browser and both visited-places experiences at mobile and
      desktop widths, with JavaScript enabled and disabled.
- [x] Run the production build and the relevant existing UI, map, and story checks.

## Dependencies

None.

## Audit evidence

- `StoryBrowser` remains `client:only="react"`. Its initial `useState` calls
  `readFilters()`, which reads `window.location`, so it cannot render on the
  server without changing component behavior. Its filters are also the primary
  controls directly below the page heading, so deferring them would delay the
  initial experience.
- `VisitedPlacesLeafletMap` now uses `client:visible` with a `200px`
  `rootMargin`. Its browser-only Leaflet import and `window` access are confined
  to `useEffect`, so server rendering preserves its accessible loading state
  before hydration.
- `VisitedPlacesExplorer` now uses `client:visible` with the same `200px`
  `rootMargin`. Its render path is server-safe and preserves the state summary,
  labeled select options, and “Browse all stories” link without JavaScript.

## Verification

- At 1280×800 and 390×844 with JavaScript enabled, the Stories filters rendered
  without horizontal overflow and selecting New York updated the URL and result
  count. Both visited-places islands retained SSR output while offscreen, then
  hydrated near the viewport; the state explorer navigated to the filtered
  Stories page.
- At both widths with JavaScript disabled, the visited-places map kept its
  loading fallback and the explorer kept all 17 state options without horizontal
  overflow. The Stories island remained empty, matching its existing
  `client:only` behavior.
- At both widths, Leaflet initialized without console errors, rendered its zoom
  control, all 68 markers, and responsive tile sets. The separate tile-failure
  check rendered the accessible error fallback and directed users to the state
  explorer.
- `npm run test:visited-map`, `npm run test:video-search`, and
  `npm run validate:ui` passed.
- `npm run build` completed successfully and generated all three pages.
