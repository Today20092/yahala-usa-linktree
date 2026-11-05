# Cnippet opportunities for YaHala

Reviewed November 5, 2026 against the current repository and Cnippet's documentation. The initial implementation is now available on the development preview; the table below preserves the placement rationale.

**Start with searchable location filters, a stories-by-state bar list, and restrained motion in the Story Browser.** They improve discovery and give the site more character without requiring a redesign.

## Best places to use components

| Priority | Component | Where in YaHala | Proposed use |
| --- | --- | --- | --- |
| 1 | [Combobox](https://github.com/cnippet-dev/ui-cnippet/blob/main/apps/v2/content/ui/pickers/combobox.mdx) | `/stories`: `src/components/StoryBrowser.tsx`; homepage: `VisitedPlacesExplorer.tsx` | Make state and city choices searchable. The current controls are native selects. Preserve the dependent city reset, disabled state, URL filters, and browser Back behavior. Keep the two-option date sort simple. |
| 2 | [Bar List](https://github.com/cnippet-dev/ui-cnippet/blob/main/apps/v2/content/charts/micro/bar-list.mdx) | Homepage, beside or beneath the visited-places map | Show the five states with the most catalog stories. Make each row a link to `/stories?state=…`. This turns a chart into a way to discover stories. Count distinct stories per state; label this as catalog coverage, not audience popularity or community size. |
| 3 | [Scroll Reveal](https://ui.cnippet.dev/motion/scroll-animations/scroll-reveal) | `/stories`: story-card grid in `StoryBrowser.tsx` | Give newly displayed cards a short, once-only fade and small upward movement. Avoid replaying every card animation after each filter change. Preserve focus movement when loading more stories. |
| 4 | [Toggle Group](https://ui.cnippet.dev/ui/actions/toggle-group) | `/stories`: existing List view / Map view controls | Present the two choices as one segmented control. Keep one selected, retain visible text labels, and preserve the URL's `view` state. This is a visual refinement of working behavior. |
| 5 | [Scroll Image Reveal](https://ui.cnippet.dev/motion/scroll-animations/scroll-image-reveal) | `/about`: Haithem's portrait | A single restrained image wipe could make the introduction feel more editorial. Keep the image's layout space reserved and its content immediately available with reduced motion. Avoid delaying the homepage's main image. |
| 6 | [Scroll Progress](https://ui.cnippet.dev/motion/scroll-animations/scroll-progress) | `/about`: longer journey and mission content | A thin reading-progress indicator could help visitors see how far they are through the page. Lower priority: useful only if the page feels long in practice. |
| 7 | [Text Highlight](https://ui.cnippet.dev/motion/text-animations/text-highlight) | `/about`: the mission statement | Emphasize one meaningful phrase, such as “Shared values,” with a quiet highlight. Keep all wording readable from the start. Prefer one emphasis to animating the whole heading. |
| 8 | [Bar List](https://github.com/cnippet-dev/ui-cnippet/blob/main/apps/v2/content/charts/micro/bar-list.mdx) | Homepage: `src/components/ReachBadge.astro` | An alternative treatment for the existing platform-view bars, if we want clearer ranking and labels. Reuse the existing totals and update date. This replaces the current visualization; it does not justify a second chart. |

## Motion we already have

The project already installs `motion`, React, Base UI, and Tailwind. Cnippet uses a compatible copy-in component approach, but individual examples still need their imports and tokens adapted. See [Cnippet's repository](https://github.com/cnippet-dev/ui-cnippet).

The homepage already has viewport reveals in `src/pages/index.astro`, animated reach bars, an animated `CountingNumber`, and a `MotionToggle`. Reuse those treatments on Astro sections such as Featured Episodes and Topic Cards. Add Cnippet's React motion components where they improve an existing React island, rather than hydrating static sections solely to reproduce an animation we already have.

Cnippet's Scroll Reveal documents reduced-motion behavior. Our pause control is separate: it sets `data-motion-paused` on a target. New motion must explicitly honor the applicable pause control as well as `prefers-reduced-motion`; installing a component does not automatically connect it.

## Charts worth considering later

- **Spark Line / Area Chart:** useful for views over time only after we store dated historical snapshots. Current reach totals alone cannot establish growth. Cnippet's [Spark Line source documentation](https://github.com/cnippet-dev/ui-cnippet/blob/main/apps/v2/content/charts/micro/spark-line.mdx) also requires Recharts, which is not currently listed in this project's dependencies.
- **Publication activity chart:** possible from catalog publication dates, but it describes publishing frequency rather than filming dates or travel history. Lower value than location-based discovery.
- **Donut chart:** could show each platform's share of recorded views, but the existing labeled bars make comparisons easier. I would keep the bars.

## What I would skip

Skip typewriter and scrambling effects on bilingual story titles, looping hero text, heavy parallax, scroll snapping, and stacked cards that conceal other stories. They add movement without helping visitors choose something to watch.

Keep the existing shared buttons, badges, cards, drawers, skeletons, and empty states. Adapt selected Cnippet patterns to YaHala's shared tokens rather than installing a second set of those primitives. Check Arabic/RTL text, keyboard operation, touch targets, light/dark themes, and reduced motion when implementing.

## Suggested first batch

1. Searchable state/city filters and a segmented List/Map control in `/stories`.
2. A homepage stories-by-state Bar List linking to the existing browser filters.
3. Once-only story-card reveals; then consider the About portrait treatment.

## Development implementation

Implemented searchable homepage and Story Browser location filters, a segmented List/Map control, once-only story-card reveals, a linked top-five state Bar List, and the About page's portrait reveal, reading progress, and mission highlight. The existing reach visualization stays in place. No new dependencies were needed. Cnippet adaptations retain an MIT notice in `public/licenses/cnippet-ui.txt`.

Preview: https://yahala-usa-linktree-atlas-preview.haithum-alqahaf.workers.dev

Validation: dependency installation, Astro/TypeScript check, UI/data validation, all CI regression commands, build, built-output smoke, and deployed smoke passed. Added distinct-story coverage tests and editorial-motion behavior tests to CI. Two old source-text assertions were made tolerant of formatting. Existing missing-icon-directory and large-chunk build notices remain; the checker reports two existing unused-code hints.

Browser interaction checks verified searchable state options and keyboard selection, dependent city enablement, URL and Back restoration, Load more focus and visible counts, List/Map switching, About pause behavior, and state-chart links. Layout measurements showed no horizontal overflow at 375px on all three routes and at desktop widths on the inspected pages. These were DOM/interaction checks: screenshot snapshots repeatedly timed out, and the fallback browser host was unavailable, so a visual screenshot review and real-device check remain outstanding. Full dark-theme visual and OS reduced-motion testing remain outstanding; reduced-motion observer behavior has an automated test.

Development deployment only. Existing concurrent working-tree changes were left alone. Some Cnippet pages were unavailable through web extraction, so their official GitHub documentation was used instead.
