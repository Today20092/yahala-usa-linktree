# Story map locations

The homepage and Story Browser use mapcn with MapLibre GL. mapcn's source is
vendored in `src/components/ui/map.tsx` from `@mapcn/map`; the MapLibre worker is
bundled locally. `StoryMapShell` owns the expanded dialog and failure boundary.
`StoryMap` uses mapcn markers, popups and controls, plus MapLibre's native
clustering with DOM buttons so grouped pins remain keyboard accessible.

Business locations come from complete US street addresses in the saved YouTube
descriptions. Only descriptions with one distinct address qualify automatically.
The geocoder must match house number, street and ZIP code in the US; city and
road-only results are rejected. This identifies a published business address,
not proof of where a video was filmed or that the business still operates there.

The importer does not alter editorial city/state assignments. Stories with no
precise address retain an explicitly approximate city pin when city coordinates
exist. Every story remains in the list. Grouped pins count locations; stories
sharing an address share a pin and appear in its popup.

## Pin names

Unselected pins use mapcn `MarkerTooltip` to show their name on pointer hover or
keyboard focus. City fallbacks explicitly say the location is approximate.
The shared tooltip supports Escape dismissal, remains open while hovered or
focused, and describes its trigger without moving keyboard focus. Touch taps
continue opening the detail popup directly.

The selected place's name appears in its popup; after dismissal, mapcn
`MarkerLabel` keeps the name beside that pin. Only the last selected pin has a
label. Changing map filters or leaving the map clears that selection. Labels
and tooltips do not appear together on the selected pin.

The map retains zoom and the expanded dialog. Compass and locate-me controls
remain disabled; no browser location permission is requested.

Tooltip/label validation passed: build, type checking, accessibility lint, UI
validation and map regressions. All 66 tests in the full Chromium matrix passed
in 1.8 minutes. Tests cover hover persistence, focus descriptions, blur/Escape
dismissal, selected-label contrast, touch taps and narrow-screen popup closing.
The popup is narrower below `sm` so its close button clears the zoom controls.
Physical-phone and real screen-reader checks remain manual; no deployment was
performed.

## Refresh

`npm run update:visited-videos` refreshes the video catalog and then the business
locations. To regenerate just the latter, run `npm run update:business-locations`.
The scheduled refresh stages both generated files:

- `src/data/business-geocodes.json`: cached successful and unsuccessful lookups.
- `src/data/business-locations.json`: accepted locations keyed by YouTube ID.

Requests run sequentially with cached results, an identifying User-Agent and
15 seconds between new lookups for recurring work. `--one-time` permits a
one-time backfill at 1.1-second intervals. Follow the
[Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
No visitor triggers geocoding. To retry an address, remove its exact cache key
and rerun the importer. HTTP/network failures stop the run; cached progress is
preserved and the previous complete location catalog remains intact.

## Validation

`npm run test:visited-map` tests address extraction, precision rejection, grouping,
city fallbacks, unassigned stories and the saved catalog's source addresses.
The Playwright mapcn test checks real marker activation, address/story links,
Escape dismissal and focus return, expanded view, grouped counts and keyboard
cluster expansion. Its basemap is mocked to isolate these interactions; actual
external tile availability requires a separate live check.

## Touch interaction

Both map views use MapLibre's cooperative gestures: two fingers pan the embedded
map and a pinch changes zoom; one-finger swipes continue scrolling the page.
The expanded dialog permits one-finger panning and locks background page
scrolling. Collapsing restores cooperative gestures. A touch-only hint explains
both modes. Touch rotation, drag rotation and touch pitch are disabled to keep
the map upright; existing zoom buttons remain available.

`tests/accessibility/map-touch.spec.ts` runs with an explicitly touch-enabled
Chromium context. Native browser touch sequences verify marker movement during
two-finger panning, pinch scaling, page scrolling with one finger, one-finger
panning while expanded, and restored touch behavior after collapse. This is
browser emulation; physical Android/iOS verification remains manual.

After the touch-control change, `npm run test:a11y:full` passed all 66 tests in
1.5 minutes across the six viewport/theme projects. Build, type checking,
accessibility lint, UI validation and map regressions also passed. No deployment
was performed.

## November 5, 2026 validation

- Backfill: 84 stories at 76 distinct published addresses. 53 descriptions with
  multiple addresses and 74 without a sufficiently precise geocode keep their
  existing city fallback; descriptions with no complete address do likewise.
- Passed: `npm run check` (zero errors; two existing unused-symbol hints),
  `npm run build`, `npm run lint:a11y`, `npm run validate:ui`,
  `npm run validate:data`, `npm run test:locations`,
  `npm run test:visited-map`, and `npm run test:atlas-polish`.
- `npm run test:a11y:full`: all 60 Chromium tests passed across six viewport/theme
  projects in 1.2 minutes. Map checks cover both consumers, popup containment,
  keyboard cluster expansion, focus return, grouped-number contrast at rest and
  hover, and the failed-basemap state. Whole-page route scans remain unchanged;
  the focused popup scan covers the map region.
- A separate real CARTO basemap check loaded the map and opened the business
  popup with no browser errors. The worker is served from the local build.
  `src/worker.js` allows the two CARTO connection hosts in its existing CSP.
- An exploratory whole-page scan after scrolling to the map at 390px found the
  existing sticky header partly covering a city-filter input. The focused map
  scan does not assess that unrelated scrolled-header state. This remains a
  separate shell accessibility issue, not a claim of complete conformance.
- Axe incomplete findings retained in `artifacts/a11y-results` concern existing
  highlighted-text contrast, contact-radio naming and the hidden QR relationship.
  Real screen-reader evaluation, physical phones, actual 400% zoom, enlarged text
  and spacing, forced colors, Astro Audit and Accessibility Insights remain manual.
- Local commands ran on Node 26.3.0; the repository's Node 22 CI was not run here.
  The build retains its missing optional icon-directory and large-chunk warnings.
  No deployment, commit or push was performed.
