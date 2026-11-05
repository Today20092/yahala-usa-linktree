# shadcn-map assessment

Reviewed November 5, 2026. Recommendation: adopt it first for the homepage visited-places map, then consider an optional map view in the story browser.

Implemented November 5: homepage replacement and `/stories?view=map`, city popups with counts, clustering, filter synchronization, expanded map dialog, vector-to-raster fallback and map data tests. The assessment below records the original proposal; individual story pages remain conditional future work. The adopted component subset uses the existing light theme and excludes drawing, public autocomplete and geolocation.

## Current usage and opportunities

Source inspection found one interactive map implementation in `src`: `VisitedPlacesLeafletMap.tsx`, mounted through `VisitedPlacesMap.astro` on the homepage. It uses Leaflet directly with OpenStreetMap raster tiles. The state selector underneath is navigation, not a separate mapping plugin.

| Location | Proposed use | Priority and work |
| --- | --- | --- |
| Homepage visited-places section | Replace the existing map with shadcn-map core, vector basemap, branded markers, tooltips, zoom and optional fullscreen controls | First migration; reuse current coordinates and city-to-story links |
| Homepage markers | Optional city popup with a story count and “Browse stories” link | Follow-up enhancement; derive counts from resolved city stories, since map marker props currently contain only location and label |
| `/stories` browser | Optional map/list view, with marker selection updating state/city filters and the URL | Best new placement; extend the existing browser rather than creating a separate catalog |
| Filtered state/city views within `/stories` | Fit the same map to the selected locations and highlight the active city | Part of the story map, not new pages; requires passing resolved place coordinates into the browser |
| Dense groups of city markers | Cluster nearby cities when useful at national zoom | Optional; cluster counts represent city markers, not story totals, unless explicitly customized |
| Future individual story/location pages | Small location map with nearby stories | Conditional on adding those pages and reliable location data; no existing individual story route was identified in this review |

Keep the state dropdown, story lists, and content with no coordinates usable independently of the map. State-only story assignments should not become falsely precise city pins. Existing coordinates represent places, not necessarily filming addresses.

## Why the appearance improves

The current upstream component combines Leaflet and React Leaflet with MapLibre GL for OpenFreeMap vector basemaps. Its default light style is Positron; it supports a dark style and OpenStreetMap raster fallback for devices without WebGL. The docs state that the default setup needs no API key. It also supplies styled controls, markers, popups and tooltips.

The improvement comes from both the basemap and UI styling. Installing the component alone will not choose our marker design, spacing, map height or interaction flow.

Sources: [project README](https://github.com/tonghohin/shadcn-map), [current API](https://shadcn-map.vercel.app/docs/api).

## Implementation approach

1. Import the upstream component into `src/components/ui/map.tsx`. The documented command is `npx shadcn@latest add @shadcn-map/map`. Review its generated changes before accepting them: the registry includes drawing, fullscreen, clustering, autocomplete, button-group and dropdown dependencies. Prefer retaining only the required parts in our owned component source, with the upstream license.
2. Reuse the installed Leaflet, React 19, Tailwind and shadcn components. Add compatible React Leaflet and the vector renderer/Leaflet bridge. Add optional control dependencies only when their code is retained. Check actual peer dependencies during installation.
3. Replace the imperative renderer in `VisitedPlacesLeafletMap.tsx`. Keep the current `places` interface, fit-to-markers behavior, US fallback view, accessible marker labels and links through `storyBrowserHref`.
4. Keep browser-dependent map code behind a safe Astro/React boundary. Preserve deferred loading if imports permit it; otherwise use a client-only wrapper with a reserved-height loading fallback. Verify production SSR rather than assuming a Next.js `use client` directive handles Astro.
5. Adapt the upstream `next-themes` integration to the site's existing light-theme policy. Do not introduce a separate theme provider just for the map. Override the upstream minimum height and stacking styles to fit the compact homepage frame.
6. Preserve touch scrolling, Ctrl+wheel behavior, resize handling, loading/error feedback, attribution and the non-map navigation fallback. Replace overlapping rules in `VisitedPlacesLeafletMap.css` only after checking the generated styles.
7. Update `scripts/test-visited-map.mjs` and the map assertions in `scripts/test-atlas-polish.mjs` where they depend on the old source structure. Verify marker destinations, empty places, tile failure, mobile interaction and fullscreen sizing. Run relevant checks and `npm run build`; compare output size and loading cost before rollout.
8. Review on the shared development Worker using `wrangler.preview.jsonc`; production deployment is a separate decision.

Sources: [installation](https://shadcn-map.vercel.app/docs), [registry dependencies and CSS](https://github.com/tonghohin/shadcn-map/blob/main/registry.json), [component source](https://github.com/tonghohin/shadcn-map/blob/main/registry/new-york-v4/ui/map.tsx).

## Scope and limits

Start with the homepage replacement. A story-browser map is a second feature, and richer popups can follow once the basic map is validated. Drawing tools, public place search, route lines and geolocation do not currently serve the existing flow. Route lines would also require trustworthy travel-order data.

This was a source and documentation assessment. No dependencies, application code or deployment changed; no runtime, visual or bundle-size checks were performed. Vector rendering adds JavaScript/GPU work and relies on external tile services, so mobile performance and fallback behavior remain implementation gates. Context7 returned older raster-only tile documentation; current live docs and upstream source were used for vector behavior.
