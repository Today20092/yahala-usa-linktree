# Site block and layout audit

Status: bounded audit complete. Source audit plus focused tests, SSR HTML counts and a bounded phone-width browser check (section 7); the full visual and accessibility evaluation remains incomplete.
Date: 2026-11-05. Scope: `/`, `/about`, `/stories`, `/contact` on the `development` working tree (uncommitted edits included). Audit only; no UI files changed.

Guidance applied: `web-ui-accessibility` skill (sections/layouts, consistency, accessibility references), `refactoring-ui`, `docs/ui-consistency.md`, `CONTEXT.md`, `docs/research/reusable-web-layouts.md`.

Evidence labels:

- **[S]** source observation from a file:line read in this session.
- **[R]** observed in a rendered browser page in this session.
- **[T]** command or test actually run in this session.

No finding here is a usability-test result. Statements about visitor impact are expected effects inferred from source, not measured behavior. This report makes no WCAG conformance claim.

## 1. Route and state coverage

| Route | Source read | Rendered (phone / desktop) | States considered from source | Not covered |
| --- | --- | --- | --- | --- |
| `/` | `src/pages/index.astro` (all 661 lines) + all imported sections | see "Checks run" | latest video present/absent (`index.astro:79-81,255`), video search enabled/disabled (`402-410`), visited places empty (`VisitedPlacesMap.astro:19`), share success/cancel/fallback (`594-660`) | real share sheet, analytics beacon on |
| `/about` | `src/pages/about.astro` (all 333 lines), `MostWatchedStories`, `EditorialMotion` (structure) | see "Checks run" | static content only | scroll-driven reading progress in browsers without `animation-timeline` |
| `/stories` | `src/pages/stories.astro`, `StoryBrowser.tsx` structure (lines 120-310) | see "Checks run" | no-JS fallback (`stories.astro:59-68`), empty results (`StoryBrowser.tsx:296-310`), map/list view toggle (`162`) | URL-shared filter deep links in a real share |
| `/contact` | `src/pages/contact.astro` (all 83 lines), `PartnershipForm.tsx` intro, form shell, draft and contact links | see "Checks run" | direct-send vs. draft mode (`contact.astro:13-15,76-80`; `PartnershipForm.tsx:228-233`), error and draft states (`~395-430`) | real submission (prohibited), Turnstile challenge |
| Shell | `BrandedPageDocument.astro`, `EditorialHeader.astro`, `LandingNavigation.tsx`, `MotionToggle.astro`, `TextReveal.astro` | see "Checks run" | mobile hide-on-scroll header (`EditorialHeader.astro:34-78`) | real touch scrolling on a device |

Not read in full: `VideoBentoGrid.astro` internals beyond header and motion CSS, `VideoSearch.tsx` result rendering, `LatestChannelVideo.astro`, `ReachBadge.astro` body, `BrandMarquee.astro` logo markup, `src/styles.css`, `src/atlas.css`, `src/pages/index.css`. Findings about those files are limited to the lines cited.

## 2. Component and section inventory

| Block | File | Consumers (verified by import/markup read) | Classification |
| --- | --- | --- | --- |
| Document shell + skip link | `src/layouts/BrandedPageDocument.astro:50-55` | all four pages | KEEP |
| Site header + primary nav | `EditorialHeader.astro:9-32`, `LandingNavigation.tsx:15-21` | shell (all pages) | KEEP; IMPROVE (F7) |
| Motion toggle | `MotionToggle.astro` | `index.astro:253`, `BrandMarquee.astro:28`, `VideoBentoGrid.astro:8,343`, `about.astro:149`, `stories.astro:51` | IMPROVE (F2) |
| Animated heading text | `TextReveal.astro` | index (247, 378, 399), about (113, 181, 199), stories (42) | KEEP (sr-only full text at `TextReveal.astro:12`) |
| Home hero image + share button | `index.astro:206-236, 594-660` | `/` | KEEP |
| Home intro + CTAs | `index.astro:242-275` | `/` | IMPROVE (F4, F9) |
| Follow / social links | `index.astro:277-311`, `SocialLinkButton.tsx` | `/` | KEEP (core link-hub task) |
| Latest video per channel | `index.astro:315-359`, `LatestChannelVideo.astro` | `/` | KEEP |
| Topic cards | `TopicCards.astro` | `index.astro:361` | REMOVE CANDIDATE / MERGE (F8) |
| Reach badge | `ReachBadge.astro` | `index.astro:365` | MERGE/REUSE with about reach aside (F6) |
| Home "about" teaser | `index.astro:371-385` | `/` | IMPROVE (F9) |
| Brand marquee | `BrandMarquee.astro` | `index.astro:388` | KEEP; IMPROVE (F2) |
| Video bento motion rows | `VideoBentoGrid.astro` | `index.astro:390` | UNCERTAIN (F2, F10) |
| "Explore more stories" header-only section | `index.astro:392-407` | `/` | IMPROVE (F5) |
| Video search | `VideoSearch.tsx` | `index.astro:410` (when enabled) | KEEP |
| Most Viewed Episodes | `FeaturedEpisodes.astro` | `index.astro:412` | MERGE/REUSE with `MostWatchedStories` (F10) |
| Visited places map + explorer + coverage | `VisitedPlacesMap.astro`, `VisitedPlacesExplorer.tsx`, `StoryCoverage.astro` | `index.astro:415` | IMPROVE / UNCERTAIN (F11) |
| Contact CTA band | `index.astro:417-437`, `about.astro:276-314` | `/`, `/about` | MERGE/REUSE (F3) |
| Footer | `index.astro:439-474`, `about.astro:317-332`, `contact.astro:62-82`; none on `/stories` | three pages | MERGE/REUSE (F1) |
| QR code dialog | `QrCodeButton.astro` | `index.astro:460` | KEEP (home only) |
| Theme script | `index.astro:477-563` | `/` | REMOVE CANDIDATE (F12) |
| About hero | `about.astro:98-169` | `/about` | KEEP; IMPROVE (F4) |
| About split sections (journey, mission) | `about.astro:171-189, 219-237` | `/about` | KEEP; shares a layout with `MostWatchedStories.astro:24-37` (S2) |
| About viewer value / principles | `about.astro:191-217, 239-261` | `/about` | KEEP; UNCERTAIN overlap with TopicCards (F8) |
| Most-watched catalog stories | `MostWatchedStories.astro` | `about.astro:263` | KEEP; MERGE/REUSE (F10) |
| About reach aside | `about.astro:265-274` | `/about` | MERGE/REUSE (F6) |
| Stories page intro | `stories.astro:37-52` | `/stories` | IMPROVE (F4) |
| Story Browser | `StoryBrowser.tsx` | `stories.astro:54-69` (`client:only`) | KEEP |
| Contact intro + back link | `contact.astro:40-51` | `/contact` | IMPROVE (F4, F13) |
| Partnership form intro | `PartnershipForm.tsx:186-210` | `contact.astro:54` | IMPROVE (F13) |
| Partnership form | `PartnershipForm.tsx:212-430` | `contact.astro:54` | KEEP; IMPROVE (F14) |

## 3. Visitor tasks per page, and what helps versus adds friction

**`/` (link hub).** Main tasks: watch the newest video, follow on a platform, find a story, get in touch.

- Helps: "Watch latest" and "Explore stories" sit right after the intro (`index.astro:254-274`); social links have visible labels and descriptions (`285-310`); the header holds Stories, About and Contact on every page (`LandingNavigation.tsx:15-21`).
- Friction: there are about 14 stacked blocks before the footer (`index.astro:205-437`), and several repeat each other: two "most watched / reach" blocks, a non-interactive topic grid, a story map that duplicates `/stories`, and two auto-scrolling strips. On a phone, a visitor who wants to contact Ya Hala has to scroll past all of them or use the header. "Explore stories" jumps to a section that contains only a heading (`271`, `392-407`).

**`/about` (About Page).** Main tasks: learn who Haithem is and why Ya Hala exists, decide whether to watch or partner.

- Helps: the h1, portrait and statement come first (`about.astro:98-169`); narrative sections are readable prose (`typeset`); the contact CTA closes the page (`276-314`).
- Friction: "Get to know me" (`122-136`) jumps to the section immediately below, which is low value. The reach line (`265-274`) repeats the home ReachBadge in a different format.

**`/stories` (Story Browser).** Main task: find a story by state or city.

- Helps: a short intro and then the browser; there is a no-JS fallback link to YouTube (`stories.astro:59-68`); the filter state lives in the URL (copy at `44-48`).
- Friction: no footer, so there are no About, Contact or privacy links at the end of the page (`stories.astro:71-72`). The browser is `client:only`, so nothing in the catalog renders before hydration (`stories.astro:55`).

**`/contact`.** Main task: send or prepare an inquiry.

- Helps: when direct sending is unavailable, draft mode explains itself (`PartnershipForm.tsx:228-233`); a fieldset/legend groups the interest options (`235-260`); a status region is present (`364`).
- Friction: before the form there are an h1 and lead (`contact.astro:46-51`), then an eyebrow, an h2, two paragraphs, an h3 and another paragraph (`PartnershipForm.tsx:186-209`). That is two introductions. The privacy note about what happens to the data is in the page footer (`contact.astro:75-81`), far from the Send button.

## 4. Prioritized findings

Each finding: source, expected visitor impact, narrow fix. All are **[S]** unless a later "Checks run" entry upgrades them.

**F1. Footers differ across pages, and `/stories` has none (high, consistency/navigation).**
Source: `index.astro:439-474` (About, Stories, Privacy, QR, copyright), `about.astro:317-332` (Home, Stories, copyright), `contact.astro:62-82` (About, Stories, privacy note); `stories.astro` ends at `71`.
Impact: links and privacy wording change from page to page. Visitors who reach the end of `/stories` have no next step besides scrolling back to the header. Touch-target sizes differ: contact sets `min-h-11` (`contact.astro:65`), while the home and about links have no minimum height (`index.astro:446`, `about.astro:322`).
Fix: one `SiteFooter.astro` rendered by the pages (or by `BrandedPageDocument`), with a fixed link set and an optional `note` slot. See S1.

**F2. Motion controls are hidden on phones, and the home page has three identical "Pause motion" buttons (high, accessibility).**
Source: `MotionToggle.astro:31-43` makes the button visually hidden below 60rem unless it has keyboard focus. The home page renders it three times (`index.astro:253`, `BrandMarquee.astro:28`, `VideoBentoGrid.astro:343`) with the same text and different `aria-controls`. The marquee and bento rows loop indefinitely (`BrandMarquee.astro:92`, `VideoBentoGrid.astro:463`); hover and focus-within pause them (`BrandMarquee.astro:100-103`), but touch users do not get that hover pause.
Impact: on a phone, a sighted touch user who is distracted by the moving strips cannot see any control to stop them (`prefers-reduced-motion` does stop them, per `BrandMarquee.astro:175-199`). A screen-reader user hears three "Pause motion" buttons with no context.
Fix: keep the toggle visible at all widths, and give each one an accessible name that names its target (for example, an `aria-label` or a visible `label` prop: "Pause brand logos"). Alternatively, keep a single page-level toggle that controls `main-content`; the CSS already responds to an ancestor `[data-motion-paused]` (`BrandMarquee.astro:102`, `TextReveal.astro:91`). Pass/fail against WCAG 2.2.2 was not evaluated.

**F3. Two different contact CTA bands (medium, consistency).**
Source: home `index.astro:417-437` (eyebrow, h2, body, default `buttonVariants`); about `about.astro:276-314` (bg-primary band, outline button with a `text-foreground` override at `302`). The home heading "Your story. Your brand. Our next stop." also appears as the form h2 on `/contact` (`PartnershipForm.tsx:189-191`).
Impact: the same action looks different on each page. The contrast of the about-page outline button on `bg-primary` was not measured.
Fix: one `ContactCta.astro`. See S3.

**F4. Page intros are hand-rolled with different type scales (medium, consistency).**
Source: eyebrow styles `stories.astro:38` (`tracking-widest uppercase`), `about.astro:103` (`tracking-[0.16em] uppercase`), `about.astro:176,224` and `MostWatchedStories.astro:26` (`text-primary text-sm font-bold`), index/contact `ui-eyebrow` (`index.astro:422`, `PartnershipForm.tsx:188`). The h1 uses `ui-page-title` on `/contact` (`contact.astro:46`) but custom sizes on `/about` (`about.astro:111`) and `/stories` (`stories.astro:41`). The home h1 is sr-only (`index.astro:239-241`), so the visible title is an h2 (`246`).
Impact: the same page role looks different on each route. This is a visual consistency cost; no comprehension effect is claimed.
Fix: use the existing `ui-eyebrow`, `ui-page-title`, `ui-section-title` and `ui-body` classes for all page intros (S2).

**F5. "Explore more stories" is a heading-only section (medium, structure/navigation).**
Source: `index.astro:392-407` wraps only a header. Video search, featured episodes and the map are siblings outside that section (`409-415`). The hero link "Explore stories" targets `#explore` (`271`), while the header's "Stories" goes to `/stories`.
Impact: the region named "Explore more stories" contains no content, so landmark and heading navigation lands on a heading followed by an empty region. Two "Explore/Stories" entry points lead to different places.
Fix: move `409-415` inside the section, or remove the wrapper section and keep the heading as a plain group header. Decide whether the hero "Explore stories" link should go to `/stories` (UNCERTAIN: needs an owner decision).

**F6. Reach shown twice with different formats (low, merge).**
Source: `index.astro:82` + `ReachBadge.astro` (animated counter, "Total views"); `about.astro:22-26,265-274` (compact "N+ views").
Fix: compute the total once (for example, a helper in `src/lib/site-config.ts`) and reuse `ReachBadge` with a `compact` variant, or keep the about line as plain text that uses the shared helper.

**F7. Header nav mixes route links and home anchors (low, navigation).**
Source: `LandingNavigation.tsx:16,18`: "Watch" and "Follow" are `/#watch` and `/#follow`. On `/about`, `/stories` and `/contact` they trigger a full navigation to the home page. `aria-current` is set only on exact route matches (`33`).
Impact: consistent with the documented rule (`docs/ui-consistency.md:15`). It is listed only because visitors on subpages may not expect "Watch" to leave the page. KEEP unless a rendered check shows confusion.

**F8. Topic cards look like categories but are not links (medium, friction).**
Source: `TopicCards.astro:34-65`: four `article`s with icon, title and description and no link. The Story Browser filters only by state and city (`StoryBrowser.tsx:120-140`), so there is no topic destination to link to. The about page has a similar "What you'll find" block (`about.astro:191-217`).
Impact: the block adds scroll length on the hub page. It contains static articles rather than links; icons and grouping alone do not establish a misleading action cue. Actual visitor expectations and any hover/pointer affordances were not tested.
Fix (REVIEW CANDIDATE): assess whether these summaries help visitors understand the available stories. Keep them as informational content when useful; shorten or remove them if they repeat the introduction without aiding choice. If a rendered check finds misleading action cues, remove those cues. Do not invent topic destinations until topic filtering exists.

**F9. Home "about" teaser is a one-line duplicate of `/about` (low).**
Source: `index.astro:371-385`: h2 plus a single sentence with no link to `/about`.
Fix: add an "About Haithem" text link here, or remove it and rely on the header's About link.

**F10. Two "most watched" lists from different sources (medium, merge).**
Source: `FeaturedEpisodes.astro:97-112` ("Most Viewed Episodes", ordered list) on `/`; `MostWatchedStories.astro` ("Most-watched catalog stories", BarList with snapshot provenance at `44-55`) on `/about`. `VideoBentoGrid` adds a third video strip on `/`.
Impact: visitors may see different "most watched" rankings on the two pages (data sources not compared in this audit).
Fix: first compare the populations, periods and ranking definitions. If the lists answer the same question, share data and entry anatomy; if they answer different questions, keep their scopes explicit and share only suitable primitives. A `list`/`bars` variant is justified only when both consumers need it. Decide whether the bento strip earns its place on `/` (UNCERTAIN: decorative motion vs. discovery value not measured).

**F11. The story map is duplicated between `/` and `/stories` (medium, UNCERTAIN).**
Source: `VisitedPlacesMap.astro:36-45` renders `VisitedPlacesLeafletMap`, the explorer and coverage on `/`. `StoryBrowser.tsx:13` renders the same map component on `/stories`. The explorer already links into `/stories` (`VisitedPlacesExplorer.tsx:50,57`).
Impact: a second interactive map on the hub page adds length and JavaScript. The explorer's hand-off to `/stories` is a good pattern.
Fix: on `/`, keep the explorer and coverage as a teaser and drop the Leaflet map, or keep the map and remove the explorer. Measure before choosing.

**F12. Theme-preference script has no controls (low, REMOVE CANDIDATE).**
Source: `index.astro:477-563` looks for `[data-theme-option]`. A repo search found no element with that attribute (only the selector at `491`), so the script always applies `'light'` (`561`). Other pages have no copy of the script. `<html class="light">` is hard-coded (`BrandedPageDocument.astro:17`).
Fix: delete the script, or move it into the shell once theme controls exist. This interacts with the "light and dark visually equivalent" rule (`docs/ui-consistency.md:11`): the dark theme is currently unreachable on `/` from source.

**F13. Two stacked introductions on `/contact` (medium, friction).**
Source: `contact.astro:46-51` plus `PartnershipForm.tsx:186-209`. The page has an h1 and the form adds an h2 and an h3, for five paragraphs of preamble in total. `contact.astro:40-45` also has a "Back to Ya Hala" link that duplicates the header brand link.
Impact: on narrow screens the form starts further down the page (to be confirmed in a rendered check). The copy repeats itself ("Sponsor a video, introduce your business…" appears at `index.astro:427-428` and `PartnershipForm.tsx:197-198`).
Fix: keep one page introduction and shorten the form preamble. With the single current consumer, edit the responsible markup directly; introduce an intro variant only if another real consumer needs it. Preserve or update the section's `aria-labelledby` relationship when removing headings. Fold "A conversation comes first" into one line near Send.

**F14. Privacy note is far from the action; draft textarea bypasses the primitive (low).**
Source: the privacy note is in the footer at `contact.astro:75-81`. The draft field is a raw `<textarea>` with custom classes (`PartnershipForm.tsx:407-414`) even though `Textarea` is imported (`14`).
Fix: move the note into the form next to Send; use `Textarea` with `readOnly`.

**F15. Host name spelled two ways (UNCERTAIN, owner decision).**
Source: `src/data/site.yaml:2-7,102-103` use "Haithum"; `site.yaml:17-19`, `about.astro`, and footer links (`index.astro:448`, `contact.astro:67`) use "Haithem". The share button label is "Share Ya Hala with Haithum" (`index.astro:213`).
Impact: if the spelling difference is not intentional (for example, brand name vs. legal name), it may look like an error. Needs an owner decision; no fix is proposed.

**F16. Home "Watch latest" CTA skips `buttonVariants` (low, consistency).**
Source: `index.astro:261` has a long inline class string with its own shadow and hover lift. The rule against this is at `docs/ui-consistency.md:7-8`.
Fix: use the established `buttonVariants` treatment. Preserve a special pill treatment only when a demonstrated design need justifies a shared variant; avoid retaining an arbitrary page-only override. The audit did not establish an exhaustive absence of other pill treatments.

## 5. First shared component/section opportunities

No universal `Section` abstraction. Each item below is a narrow component with a fixed content contract.

**S1. `SiteFooter.astro`.**
Current: `index.astro:439-474`, `about.astro:317-332`, `contact.astro:62-82`; missing on `stories.astro`.
Contract: no required props. Fixed links: Home, Stories, About, Contact, Privacy. `note?: string` slot for page-specific text (the contact privacy note, until F14 moves it). `showQr?: boolean` (true only on `/`). Copyright line from `siteConfig.site.pageTitle`. All links `min-h-11`.

**S2. Page/section heading group (`SectionHeading.astro`).**
Current: `stories.astro:37-49`, `contact.astro:46-51`, `about.astro:102-120,175-183,223-231`, `MostWatchedStories.astro:25-37`, `index.astro:321-328,397-406`, `TopicCards.astro:38-42`, `VisitedPlacesMap.astro:24-33`.
Contract: `level: 1 | 2`, `title: string`, `eyebrow?: string`, `lead?: string`, `id` (for `aria-labelledby`), `align?: 'start' | 'center'`, `reveal?: 'blur' | 'slide' | false` (wraps `TextReveal`). Renders `ui-eyebrow`, `ui-page-title`/`ui-section-title` and `ui-body` only. It does not own section padding or grid layout.

**S3. `ContactCta.astro`.**
Current: `index.astro:417-437`, `about.astro:276-314`.
Contract: `eyebrow?`, `title`, `body`, `ctaLabel` (default `siteConfig.about.partnerCtaLabel`), `tone: 'plain' | 'band'`. The `href` is always `${baseUrl}contact`. The button uses `buttonVariants` only; the band tone gets one contrast-checked token pair.

**S4. `MostWatched` (merge `FeaturedEpisodes` + `MostWatchedStories`).**
Current: `FeaturedEpisodes.astro` (used at `index.astro:412`), `MostWatchedStories.astro` (used at `about.astro:263`).
Contract: `limit: number`, `variant: 'list' | 'bars'`, data from one snapshot source with `capturedAt` and source link always shown.

**S5. Reach summary.**
Current: `ReachBadge.astro` (`index.astro:365-369`), `about.astro:265-274`, total computed at `index.astro:82` and `about.astro:22`.
Contract: helper `getTotalReach()` in `src/lib/site-config.ts`; `ReachBadge` gets `variant: 'full' | 'inline'`.

## 6. Phased small steps

1. **Phase 0, motion access:** F2 visible controls with a clear target at all widths. Run the existing `scripts/test-motion-toggle.mjs` plus a rendered touch-without-hover check; source tests already passed while missing the observed phone problem.
2. **Phase 1, shared footer:** S1, then add it to `/stories`. Verify on all four routes at 320px and desktop; validate destinations and retain distinct page-specific privacy wording near its relevant action.
3. **Phase 2, focused cleanup:** F14 (Textarea primitive and privacy placement), F5 (repair the `#explore` grouping), F16 (shared action treatment). Resolve intended theme behavior before deleting or relocating F12's script; theme preference can have behavior beyond visible controls. These are focused edits, not a guarantee of no visual change.
4. **Phase 3, heading group:** S2 on `/stories` and `/contact` first (smallest pages), then `/about`, then home sections.
5. **Phase 4, CTA and contact intro:** S3 and F13 (one introduction, no speculative configuration prop).
6. **Phase 5, content decisions:** evaluate F8 topic summaries, F10/S4 ranking scopes, F11 map's discovery value, F15 name spelling, and F5 hero link target. Use local prototypes and actual task evidence before removal. Deployment is a separate action outside this audit.

For every UI implementation phase, follow [the current accessibility workflow](../accessibility-testing.md): cached source lint while editing, focused rendered behavior checks, and the default rendered gate before handoff. Shared components/tokens also require affected consumers and themes. Run the existing focused regressions and `validate:ui` as complements, and record incomplete/manual checks. The new rendered gate was not run for this audit.

### Parent review refinements

The five extraction proposals above are starting hypotheses, not approved APIs. Start `SiteFooter` with validated shared links and needed page slots; do not invent a Privacy route. Reuse existing heading classes before adding a wrapper, and do not force different page families to share a display scale. A `ContactCta` is a strong two-consumer candidate; give its tone variants a content/context reason. Compare most-watched data scopes before merging them. Share reach computation first; add a presentation variant only if both uses need the same anatomy. F7's home anchors are an intentional documented convention, not a defect. These refinements apply the updated skill's rule to share equivalent decisions while preserving task-specific composition.

## 7. Checks run

### Commands [T]

| Command | Result |
| --- | --- |
| `npm run validate:ui` | pass: "UI consistency check passed: 70 source files scanned." It did not flag F16 (`index.astro:261`) or the raw textarea (F14), so the validator does not cover those patterns. |
| `npm run test:motion-toggle` | pass (text and scroll reveals, reduced motion, fallback) |
| `npm run test:site-navigation` | pass (shared navigation, scroll direction, focus, reduced motion) |
| `npm run test:branded-document` | pass |
| `npm run test:story-coverage` | pass |

Commands run from PowerShell. Git Bash `npm` could not find `node.exe`, which is an environment problem, not a project failure.

### Dev server and SSR HTML [T]

- The prior audit server (pid 40120, port 4399) was no longer running. `.astro/dev.json` was stale.
- First fresh start (pid 2484): every route returned HTTP 500. `.astro/dev.log` showed `Cannot find module 'astro-seo'`, `astro/assets` and `shiki/dist/wasm.mjs`, which looks like `node_modules` changing during a concurrent install by another process. No reinstall was run. When checked again a little later, the packages were present.
- Second start (pid 34804): all four routes returned 200. Counts from the server-rendered HTML:

| Route | `<footer>` | motion toggles | h1 | h2 | `data-theme-option=` | `<section>` |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 1 | 3 | 1 | 13 | 0 | 12 |
| `/about` | 1 | 1 | 1 | 6 | 0 | 7 |
| `/stories` | 0 | 1 | 1 | 0 | 0 | 1 |
| `/contact` | 1 | 0 | 1 | 1 | 0 | 1 |

These counts confirm F1 (no footer on `/stories`), F2 (three toggles on `/`) and F12 (no theme controls are rendered). The single h2 on `/contact` is the PartnershipForm intro (F13).

### Browser, 375×740 viewport, T3 preview [R]

- `/contact`: no horizontal overflow (`scrollWidth` 360 against a 375 viewport, so content is narrower than the window). The header is 97px tall. The form starts at y=911 and its first fieldset at y=1036, so on this viewport the form starts below the first screen (F13 confirmed). Locally the Send button reads "Prepare my inquiry" (draft mode; direct send is not configured in dev). Send is at y=2068 and the privacy note at y=2341, 273px below Send (F14 confirmed). Nothing was submitted.
- `/`: document height 6339px. The contact CTA section starts at y=5778, about 7.8 viewport heights down. All three "Pause motion" buttons render at 1×1px (visually hidden) and have identical names, while 5 animated motion elements were running (F2 confirmed at phone width). `#explore` has 1 child, its header only (F5 confirmed). The h2 order matches the inventory in section 2.
- Not checked in the browser: desktop layout, `/about` and `/stories` rendering, keyboard focus order, the hide-on-scroll header on touch, contrast measurements (including the F3 outline button on `bg-primary`), 200% text and text-spacing, dark theme (unreachable per F12), screen-reader output, and the map and filter interactions.

### Cleanup

- Closed the preview tabs I opened (`tab_11…`, `tab_12…`). I did not control the prior delegate's tab `tab_10…`, and it was not listed for this thread, so it was not closed.
- Stopped only the audit servers I verified on port 4399 (pids 2484 and 34804). Ports 4321 and 4322 were not touched. `.astro/dev.json` still records pid 34804, which is no longer running.

## 8. Limitations

- Section 4 findings are source-based unless section 7 confirms them. Impact statements describe expected visitor effects, not tested ones.
- No contrast was measured, and no WCAG conformance is claimed.
- Some files were read only in part; section 1 lists them.
- The `codebase-memory` graph was not queried in this session. Consumers were verified by reading imports and markup directly.
- Parent review subsequently checked index coverage for 25 cited page/layout/component files against generation `2026-11-05T20:20:02Z`: all reported `no_recorded_issue` and `metadata_match`. This best-effort coverage signal does not substitute for behavioral verification or make the child's source inventory exhaustive. Earlier parent graph search/trace results were provided in the audit brief.
