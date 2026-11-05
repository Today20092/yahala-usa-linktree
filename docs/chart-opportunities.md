# Chart opportunities for YaHala

Reviewed November 5, 2026. The first two recommendations are implemented for development preview; remaining items require additional analytics.

**Improve the existing platform bars first. The best new placement is a “Most-watched stories” Bar List before About’s collaboration CTA, after refreshing its data.** Growth and audience-location charts would be useful sponsor evidence once real analytics support them.

## What the data can honestly show

- [Site data](../src/data/site.yaml) records **155,359,353 video views** across Facebook, TikTok, Instagram, and YouTube, updated **June 22, 2026**. This is one snapshot with no verified reporting window. It does not measure unique people, followers, or deduplicated reach across platforms.
- [ReachBadge](../src/components/ReachBadge.astro) already shows the total and four platform bars. [StoryCoverage](../src/components/StoryCoverage.astro) already adds linked top-five state bars beside the homepage map; [its counting logic](../src/lib/story-coverage.ts) counts distinct story IDs per state. These describe catalog/filming geography, not audience geography.
- The [YouTube catalog](../src/data/youtube-videos.json) contains 442 valid video records, including 324 marked non-Short. Only 295 have numeric view counts, all non-Short, with metadata capture dates spanning June 9–November 5, 2026. A ranking today would mix old and newer observations and omit some stories.
- [Visited-video assignments](../src/data/visited-videos.yaml) are location associations, not verified counts of distinct businesses or people. No historical reach series, follower series, or audience-location analytics were found in the inspected data.

## Recommended placements

| Order | Placement and chart | Value and prerequisite |
| --- | --- | --- |
| 1 — now | **Home: refine the existing platform-view bars** in `ReachBadge.astro`, using the [Cnippet Bar List](https://ui.cnippet.dev/docs/chart-components/micro) pattern. | Rank descending, show exact view counts alongside compact labels, and keep the update date visible. Optional shares must say “share of recorded platform views.” Confirm the reporting window and refresh the stale snapshot before presenting it as current. This replaces the existing treatment; it adds no second chart. |
| 2 — after data refresh | **About: top-five “Most-watched stories” Bar List immediately before the collaboration CTA** in [the About route](../src/pages/about.astro). | Turn sponsor proof into watchable examples: title, view count, and a link to each video. Cnippet’s [Bar List](https://ui.cnippet.dev/docs/chart-components/micro) suits ranked named values. Refresh all eligible story metadata in one consistent run and disclose coverage and capture date. Until coverage is complete, label it “Most-watched among catalog stories with recorded views”; do not imply a channel-wide ranking or sum this subset into the cross-platform total. |
| 3 — future | **Near Home’s total, a small Spark Line; or in About’s partnership section, an Area Chart.** Choose one. | Show whether exposure is growing. Collect regularly dated, consistently defined snapshots or native platform analytics first. [Spark Line](https://ui.cnippet.dev/docs/chart-components/micro) suits a compact trend; [Area Chart](https://ui.cnippet.dev/charts/cartesian/area-chart) suits a fuller time series. Keep cumulative totals separate from views earned during a period. Never invent earlier points or percentage deltas. Add [7/30/90-day controls](https://ui.cnippet.dev/charts/interactive/time-range-chart) only when those windows have adequate data. |
| 4 — future | **About partnership section: top audience countries or cities as a Bar List.** | Answer a prospective partner’s “Where are the viewers?” Requires true platform audience-geography exports, with platform, metric, period, and denominator stated. Keep platforms separate unless an aggregation method is justified. Story locations cannot supply this chart. [Cnippet’s micro charts](https://ui.cnippet.dev/docs/chart-components/micro) support the ranked presentation. |

## Keep the chart count small

Keep the existing map and state chart. Small “states featured” or “cities featured” counters could contextualize them after validating distinct-location rules; another state chart would repeat the same information.

Skip a platform-share donut: [Cnippet’s polar guidance](https://ui.cnippet.dev/docs/chart-components/polar) positions donuts for shares, but the existing labeled bars already support comparison. Skip arbitrary-target gauges, radar charts mixing incompatible metrics, and funnels treating unrelated platforms as sequential stages. A [heatmap](https://ui.cnippet.dev/docs/chart-components/matrix) of publication dates would show publishing activity, not audience exposure. Never market summed platform unique audiences as deduplicated people.

## Implementation order and guardrails

1. Validate metric definitions, reporting window, and freshness; refine the platform bars using the existing [Bar List primitive](../src/components/ui/bar-list.tsx).
2. Refresh eligible story view counts consistently, state coverage, then add the About ranking.
3. Collect historical and audience-geography analytics before considering the two future charts.

Use public aggregate data only; keep analytics credentials and viewer-level exports out of the repository and browser bundle. Suppress very small geographic groups. Show text labels, exact values, source/date/period, and an accessible list or table; do not depend on color or hover. Preserve keyboard links, Arabic/RTL readability, shared tokens, reduced motion, and the site’s pause control.

Recharts is absent from [current dependencies](../package.json); Cnippet’s [Spark Line source documentation](https://raw.githubusercontent.com/cnippet-dev/ui-cnippet/main/apps/v2/content/charts/micro/spark-line.mdx) lists it as a dependency. Reuse the existing Bar List now; review imports, license attribution, hydration, and bundle cost before adopting a future chart. No packages are needed for this recommendation.

Evidence: repository source inspection and catalog count/date checks, plus the primary Cnippet references linked above. Graph tooling was unavailable in the parent investigation; no graph verification is claimed. No browser, build, or runtime validation was performed for this documentation-only change.

## Development implementation — November 5, 2026

- Home platform bars now rank by descending combined platform views. Exact labels and the original June 22 snapshot date remain; copy explicitly distinguishes views from unique viewers. The old cross-platform snapshot was not updated without a verified analytics source.
- About now includes a linked top-five story Bar List before the closing CTA. It reuses the existing Cnippet-derived component, rendered on the server with no new dependencies or hydration. The shared primitive supports a view unit, Arabic direction, wrapping titles, and a space between the title and value; existing state bars keep their story unit.
- `src/data/story-view-snapshot.json` records the five selected values and coverage. Its source is a single fresh public Videos-tab collection: `yt-dlp --ignore-config --flat-playlist --dump-single-json https://www.youtube.com/@YaHalaUSA/videos`. Match IDs to long-form catalog records (`isShort === false`, excluding known portrait formats), retain nonnegative safe-integer `view_count` values, deduplicate by video ID, sort descending with ID tie-break, and select five. On collection, 323 of 324 eligible stories had available counts; `lItHVDEnnSI` was absent. Public playlist counts are rounded, so the chart calls them approximate and states its collection date and incomplete coverage. Refresh this snapshot using the same method; it is not an automatic or live analytics feed.
- Extended `test:reach-chart` verifies snapshot integrity, order, eligible stories, exact displayed values, links, server rendering, units, and disclosures. All CI baseline checks and regression commands passed; the built-output smoke passed after aligning its QR-order expectation and fixture with the existing footer placement. Build and Wrangler packaging dry run passed. No dependency upgrades were made.
- DOM checks on the local About chart verified five watch links, Arabic direction, focus, touch-sized rows, no horizontal overflow at 320px, and no overflow with 200% root text plus text-spacing overrides. A visual snapshot timed out; screen-reader and real-device checks remain unavailable. Existing theme limitations from `motion-accessibility-review.md` still apply.
- Deployed the working tree based on `3567d78` to the pinned Haithum development Worker. Version: `ee39cea4-14e7-4ad7-ac40-6f976e8d3c94`. [Open the chart](https://yahala-usa-linktree-atlas-preview.haithum-alqahaf.workers.dev/about/#most-watched-title). Deployed smoke passed with all ten referenced assets and CSP present; deployed About DOM confirmed five bars, the 323-of-324 coverage note, and no overflow at 320px. Production was not deployed. Local managed dev and preview servers were restarted after lockfile installation; localhost and Tailscale dev health checks passed.
