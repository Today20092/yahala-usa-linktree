# Design system research: semantic tokens, light/dark themes and layout primitives

Research date: **2026-11-14**. Scope: theming and design-system practice from primary sources, compared against this repository at commit `7194cbe` with uncommitted working-tree changes. This is a research note and makes no code changes.

Evidence labels: **Repo** means read in this repository (with `file:line`). **Source** means read in the cited primary source. **Synthesis** means my recommendation. Some pages are rendered client-side (Material 3 token overview, Stitch DESIGN.md, Samsung One UI). Where I could not extract their text, the claim says so.

---

## 1. TL;DR

- **Most of the dark palette is already written but switched off.** `tokens.css:117-155` defines a full shadcn `.dark` set. Three things then override it. The layout hard-codes `class="light"` (`src/layouts/BrandedPageDocument.astro:17`). `color-scheme: light` is pinned in four places. The live "Atlas" look reads light-only `--color-paper`/`--color-ink` tokens (`tokens.css:201-221`, `src/atlas.css:7-15`), and those tokens have no dark values.
- **Two token systems coexist.** One is the shadcn semantic set (`--background`, `--primary`, …). The other is an "Atlas" paper/ink set that re-maps the semantic set, but only for `html[data-design]` and `.partnership-section` (`tokens.css:224-243`). It also has leftover `field`/`night` preview themes. Collapse them into one tiered system.
- **Raw-color debt is small.** Outside generated data, `src/` has 25 hex literals (19 of them in the upstream `ui/map.tsx`), 3 `rgb()` calls, 8 Tailwind palette classes and about 38 raw `oklch()` shadow values in `src/styles.css`. A ban can be added and enforced within days.
- **The dark-mode tests are false positives today.** `playwright.a11y.config.ts:28-45` runs `desktop-dark` and other projects with `colorScheme: 'dark'`. The page forces light (`src/pages/index.astro:532`), so those runs actually test the light theme.
- **Follow shadcn's own convention.** Use `name`/`name-foreground` pairs defined under `:root` and `.dark`, exposed with `@theme inline`, written in OKLCH ([shadcn theming](https://ui.shadcn.com/docs/theming)). Add `success`/`warning`/`info` the documented way.
- **Switch themes with a blocking inline `<head>` script**, as Astro, shadcn, Tailwind and Starlight all document. Offer three choices (system, light, dark) and treat "system" as the absence of a stored value. The worker already stamps CSP nonces on scripts (`src/worker.js:62`).
- **Lock it in for agents.** Write one `docs/design-system.md` linked from `AGENTS.md`. Extend `validate:ui` to fail on raw colors and on `dark:` in feature code, as Cloudflare's Kumo does ([Kumo AGENTS.md](https://github.com/cloudflare/kumo/blob/main/AGENTS.md)). Run axe contrast checks in real light and dark modes.

---

## 2. Recommendations for this repo (prioritized)

| #   | What                                                                                                                                                                                              | Why                                                                                                                   | Effort | Files touched                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Make the a11y suite fail when dark mode is not actually applied: assert `html.dark` in `*-dark` projects                                                                                          | Today's dark runs test the light theme, so every later phase needs a real gate                                        | S      | `playwright.a11y.config.ts`, `tests/accessibility/*`                                                                                   |
| 2   | Ban raw colors in `validate:ui`: hex, `rgb()`/`hsl()`, raw `oklch()` outside token files, Tailwind palette classes, arbitrary `[#…]`; allow a short list of exceptions                            | Stops new drift; agents follow lint failures more reliably than prose                                                 | S      | `scripts/validate-ui-consistency.mjs`, `scripts/test-ui-consistency-validator.mjs`                                                     |
| 3   | Merge Atlas paper/ink into the semantic tier: Atlas primitives get light **and** dark values, and `--background`/`--card`/… reference them globally, not only under `html[data-design]`           | Today's look and the dark palette are two parallel systems; dark mode cannot work while `--color-paper` is light-only | M      | `tokens.css`, `src/atlas.css`, `src/pages/index.css`, `src/styles.css`                                                                 |
| 4   | Delete the dead `field`/`night`/`data-design` blocks and the second `:root`                                                                                                                       | Removes three competing definitions of the same tokens                                                                | S      | `tokens.css:157-221`, `validate-ui-consistency.mjs:118-160`                                                                            |
| 5   | Add status pairs `success`, `warning`, `info` (plus their `-foreground`), using the shadcn recipe                                                                                                 | `/admin` and the testimonials UI need status colors; prevents `text-green-600` creeping in                            | S      | `tokens.css`, `src/styles.css:882-891` (move the `destructive-foreground` block into `tokens.css`)                                     |
| 6   | Move per-component dark overrides into tokens: elevation, `ui-surface-card`, `brand-*-link`, `collaboration-cta`, so components stop needing `.dark .x {}`                                        | Ensures "swap tokens, everything follows"; 17 `.dark` selectors in CSS and 63 `dark:` utilities today                 | M      | `src/styles.css`, `src/components/ui/*.tsx`, `LatestChannelVideo.astro`                                                                |
| 7   | Theme switching: blocking inline boot script in `BrandedPageDocument` head, a `ThemeToggle` (System/Light/Dark) in `EditorialHeader`, `color-scheme` driven by the class, `theme-color` meta pair | Makes dark mode reachable with no flash on any route (today's script runs only on `/`)                                | M      | `BrandedPageDocument.astro`, `EditorialHeader.astro`, new `src/components/ThemeToggle.astro`, `src/pages/index.astro:448-533` (delete) |
| 8   | Layout primitives: `Section`, `Container`, `Stack`/`Cluster`, `PageHeader`, kept beside `EditorialHeader`/`SiteFooter`                                                                            | Encodes the 76rem/72rem shell rules from `docs/ui-consistency.md` in code, not prose                                  | M      | `src/components/layout/*` (new), pages                                                                                                 |
| 9   | Agent-facing `docs/design-system.md`: token table, "which token for what", do/don't, layout primitives; link from `AGENTS.md`; fold in `docs/ui-consistency.md`                                   | One canonical place that Claude, Codex and humans all read                                                            | S      | `docs/`, `AGENTS.md`                                                                                                                   |
| 10  | Optional later: DTCG JSON → Style Dictionary → `tokens.css`                                                                                                                                       | Worth it only if tokens must feed Figma or a native app; plain CSS is fine for one site                               | L      | new `tokens/*.json`, build script                                                                                                      |

### Phased plan

**(a) Audit and ban raw colors (S, about 1 day).** Turn the counts in §3 into a failing rule in `validate:ui`. Keep exceptions explicit and commented: third-party map styles in `ui/map.tsx`, the QR code's required black/white, `theme-color` meta values, scrims `bg-black/NN` (or move these to `bg-scrim/NN`, which already exists as `--color-scrim`), and `text-white` on brand-colored social tiles (or add `--social-*-foreground`). Add fixtures to `test-ui-consistency-validator.mjs`. Do recommendation #1 in the same PR so later phases have a working gate.

**(b) Complete the semantic token set with dark values (M).** The structure I recommend, following shadcn and Primer's base/functional split ([Primer color](https://primer.style/foundations/color/overview)):

```css
/* tier 1 – primitives: never used in components */
:root { --paper-1: oklch(98% .006 283); --ink-1: oklch(30.7% .095 283.4); --brand-rose-600: …; }
/* tier 2 – semantic: the only names components may use */
:root  { --background: var(--paper-1); --foreground: var(--ink-1); --primary: var(--brand-rose-600); … color-scheme: light; }
.dark  { --background: var(--night-1); --foreground: var(--ink-on-night); … color-scheme: dark; }
@theme inline { --color-background: var(--background); … }
```

Then delete the `html[data-design], .partnership-section` remap at `tokens.css:224-243`. Point `atlas.css`/`index.css` consumers of `--color-paper`, `--color-ink`, `--color-rule` and `--brand-action` (31 uses in 6 files) at semantic names. Check every pair against WCAG in both themes (§7).

**(c) Theme switching with no flash (M).** Add the inline script before any stylesheet in `<head>` (pattern in §4). Set both `.dark` and `style.colorScheme`. Read `localStorage.theme` inside try/catch and fall back to `prefers-color-scheme`. Listen for system changes only while the preference is "system". Add a three-state toggle using the existing `ToggleGroup` or `menu.tsx`, with `aria-pressed` or radio semantics. Remove `class="light"` and the four `color-scheme: light` pins. Replace the single `theme-color` meta with two `media`-scoped metas. `ui/map.tsx` already follows the `.dark` class (`map.tsx:114-162`).

**(d) Layout and section primitives (M).** Add `Container` (76rem shell with 20–32px gutters), `Section` (vertical rhythm, optional `tone="muted|card"` backgrounds drawn only from tokens, `aria-labelledby` wiring), `PageHeader` (h1 with `ui-page-title`, kicker, lede) and `Stack`/`Cluster` layout helpers ([Every Layout](https://every-layout.dev/) names these primitives). They supplement `BrandedPageDocument`, `EditorialHeader` and `SiteFooter`. `docs/research/reusable-web-layouts.md` already lists which section types to build.

**(e) Agent docs, enforcement and contrast in both themes (S–M).** Add `docs/design-system.md` (§8) and link it from `AGENTS.md`. Extend `validate:ui` to also ban `dark:` outside `src/components/ui/` (Kumo bans it everywhere, [AGENTS.md](https://github.com/cloudflare/kumo/blob/main/AGENTS.md)). Make the a11y gate run `mobile-light` and `desktop-dark` with dark mode really applied. Optionally add Playwright `toHaveScreenshot` baselines for each route in each theme ([Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)).

---

## 3. Current state of this repo

### Token files and wiring (Repo)

- **`components.json`** uses `style: "base-rhea"`, `baseColor: "stone"`, `cssVariables: true` and CSS file `src/styles.css`. It also lists registries `@animate-ui`, `@cnippet` and `@mapcn`.
- **`src/styles.css:1-4`** imports `../tokens.css` and then `tailwindcss`, `tw-animate-css` and `shadcn/tailwind.css`.
- **`src/styles.css:19`** declares `@custom-variant dark (&:is(.dark *));`. This is class-based dark mode, as shadcn and Tailwind recommend.
- **`tokens.css:1-114`** is the `:root` shadcn semantic set in OKLCH (background, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, radius) plus brand and social extras, spacing, type scale, motion and radii.
- **`tokens.css:117-155`** is a complete `.dark` override set. **A dark palette exists.**
- **`tokens.css:157-199`** contains `html[data-design='field']` and `html[data-design='night']`, leftover preview themes. Nothing in `src/` sets `data-design`. `validate-ui-consistency.mjs:118-122` forbids it in the layout.
- **`tokens.css:201-221`** is a **second `:root`** that redefines the Atlas primitives (`--color-paper*`, `--color-ink*`, `--color-rule`, `--brand-action`, `--color-focus`). The values are light only, and the block pins `color-scheme: light`.
- **`tokens.css:224-243`** applies `html[data-design], html .partnership-section { --background: var(--color-paper); … }`, so the Atlas palette drives semantic tokens **only** on the partnership section.
- **`tokens.css:245-299`** is `@theme inline`, which exposes the semantic, brand, sage and channel colors and the radius scale to Tailwind. This is correct per shadcn.
- **`src/styles.css:882-891`** has a stray `--destructive-foreground` defined outside `tokens.css`.

### What blocks dark mode today (Repo)

1. `src/layouts/BrandedPageDocument.astro:17` renders `<html class="box-border light">`.
2. `color-scheme: light` is pinned at `src/styles.css:35`, `src/atlas.css:8`, `tokens.css:176` and `tokens.css:221`.
3. `src/atlas.css:11-15` sets `html body { background: var(--color-paper); color: var(--color-ink) }`. These light-only primitives bypass `--background`/`--foreground`, so adding `.dark` changes components but not the page.
4. The theme script lives **only** in `src/pages/index.astro:448-533`. It is a bundled module script that runs after paint, so it would flash. It also calls `applyTheme(hasThemeControls ? getPreference() : 'light')` (`:532`), and no `[data-theme-option]` buttons exist anywhere in `src/`. The toggle was added in `1aa1f2c` and later removed. Commit `38e7ce0` ("keep page in light mode") pinned `/about`.
5. `BrandedPageDocument.astro:44` has a single `<meta name="theme-color" content="#ffffff">`, and the skip link uses `--color-paper`/`--color-ink` (`:75-76`).
6. **The tests never see dark mode.** `playwright.a11y.config.ts:28-45` defines `desktop-dark`, `mobile-dark` and `tablet-dark` with `colorScheme: 'dark'`. Because of items 1–4 these render the light theme, so "desktop-dark passed" in `docs/accessibility-testing.md:12,47,120` is not evidence about dark contrast.

### Hard-coded colors in `src/` (Repo, counted with ripgrep-style regexes, excluding `src/data/`)

| Kind                              | Count | Where (examples)                                                                                                                                                                                                                                  |
| --------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hex literals                      | 25    | `ui/map.tsx` ×19 (e.g. `:1433` `'#4285F4'`, `:1901-1902` map fill/line); `index.astro:458-459` theme-color; `QrCodeButton.astro:16-17`; `BrandedPageDocument.astro:44`; `pages/index.css:249` (`#0000` ring reset)                                |
| `rgb()/rgba()/hsl()`              | 3     | all in `ui/map.tsx`                                                                                                                                                                                                                               |
| Raw `oklch()` outside token files | 39    | `src/styles.css` ×38 (elevation and shadow stacks, e.g. `:180-215`, `:396-399`); `ui/drawer.tsx:66` (`shadow-[…rgb(15_23_42_/_0.18)]` + `dark:shadow-[oklch(…)]`)                                                                                 |
| Tailwind palette classes          | 8     | `text-white` ×2 (`SocialLinkButton.tsx:49`, `VideoBentoGrid.astro:211`); `bg-black/32` (`ui/alert-dialog.tsx:31`); `bg-black/40` (`ui/drawer.tsx:47`); `border-white bg-blue-500` (`ui/map.tsx:669`); `fill-red-500/300` (`ui/map.tsx:1137-1138`) |
| Arbitrary `[#…]` color classes    | 0     | Arbitrary `color-mix()` over tokens exists (`ui/button.tsx:12,16`, `ui/toast.tsx:69`, `LatestChannelVideo.astro:74,114`). These are token-based and acceptable, but better promoted to named tokens such as `--primary-hover`                     |
| `dark:` variants                  | 63    | `ui/button.tsx` 9, `LatestChannelVideo.astro` 8, `ui/toast.tsx` 6, `ui/map.tsx` 5, `ui/textarea.tsx` 4, `ui/radio-group.tsx` 4 …                                                                                                                  |
| `.dark` CSS selectors             | 17    | `src/styles.css:196-212` (elevation), `:369`, `:394`, `:489`, `:763-816`, `:846`                                                                                                                                                                  |

**Synthesis:** The debt is concentrated in a few places. Most of it is the vendored `ui/map.tsx` from `@mapcn` and `src/styles.css` shadows. Feature components are already mostly token-clean.

### Existing guardrails (Repo)

- `docs/ui-consistency.md` already states "no one-off hex colors" and "light and dark should be visually equivalent". It covers shared primitives (`Button`, `Badge`, `IconBadge`, `ui-surface-card`, heading classes) and the 76rem shell.
- `scripts/validate-ui-consistency.mjs:80-87` catches only `(bg|text|border)-\[#`, `bg-white/95`, `bg-black/10` and `shadow-[`, and only in **page** files. Components and CSS are not checked for raw colors. The validator does block duplicate token declarations across CSS files (`:99-108`).
- `npm run lint:a11y` uses `eslint-plugin-jsx-a11y-x`, and `npm run test:a11y` runs Playwright with axe across light and "dark" projects.
- Shared layout pieces already exist: `BrandedPageDocument`, `EditorialHeader`, `SiteFooter`, `LandingNavigation`. There is no generic `Section`/`Container` yet.

---

## 4. How shadcn does it / how T3 Code does it

### shadcn/ui (Source: [theming](https://ui.shadcn.com/docs/theming), [dark mode for Astro](https://ui.shadcn.com/docs/dark-mode/astro), [source MDX](https://github.com/shadcn-ui/ui/tree/main/apps/v4/content/docs))

- **Pairs convention:** "We use semantic background and foreground pairs. The base token controls the surface color and the `-foreground` token controls the text and icon color that sits on that surface." The `-background` suffix is omitted, so `primary` pairs with `primary-foreground`.
- **Token set:** `background`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1…5` and `sidebar-*`. "These tokens live in your CSS file under `:root` and `.dark`."
- **Radius:** `--radius` is the base, and `@theme inline` derives `--radius-sm…4xl` from it with `calc()`. This repo already does the same (`tokens.css:268-274`).
- **Adding tokens:** define the token under `:root` and `.dark`, then expose it through `@theme inline`:

```css
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}
.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}
@theme inline {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

- **Why `@theme inline`:** Tailwind says to use the `inline` option when theme variables reference other variables, so the utility uses the variable's value ([Tailwind theme variables](https://tailwindcss.com/docs/theme)).
- **Astro dark mode:** an inline script reads `localStorage.theme`, falls back to `matchMedia('(prefers-color-scheme: dark)')` and toggles `document.documentElement.classList` `dark`. A React `ModeToggle` offers Light/Dark/System ([dark-mode/astro](https://ui.shadcn.com/docs/dark-mode/astro)). shadcn's sample persists with a `MutationObserver` and does not re-listen to OS changes. T3 Code and Starlight handle "system" better (below).

### T3 Code (Source: [pingdotgg/t3code @ 64d70f8](https://github.com/pingdotgg/t3code/tree/64d70f8828e840ccd1f0d483499d96e9b42bc99e/apps/web))

- **Tokens:** `apps/web/src/index.css` uses shadcn names: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`. It adds status pairs `--info`, `--success`, `--warning` (+`-foreground`, `--warning-surface`). It also adds app-surface tokens that alias the core set, such as `--app-chrome-background`, `--toolbar-*`, `--surface-raised`, `--code-*` and `--terminal-*` ([index.css:1113-1166](https://github.com/pingdotgg/t3code/blob/64d70f8828e840ccd1f0d483499d96e9b42bc99e/apps/web/src/index.css#L1113)). That is a component tier built on the semantic tier.
- **Light and dark in one block:** dark values sit in a nested `@variant dark { color-scheme: dark; --background: #000; … }` inside `:root`, and the custom variant is `@custom-variant dark (&:is(.dark, .dark *))`. There is also a `light` variant (`index.css:5-6`).

```css
:root {
  color-scheme: light;
  --background: var(--color-zinc-25);
  --primary: oklch(0.488 0.217 264);
  --success: var(--color-emerald-500);
  @variant dark {
    color-scheme: dark;
    --background: #000;
    --primary: oklch(0.571 0.21 264);
  }
}
```

- **Named themes:** `html[data-theme-id="grove" | "ocean" | "ember" | "iris" | "t3-chat"]` blocks override palette variables, each with its own nested `@variant dark` (`index.css:757-912`). So a theme is an _id_, while light or dark is an _appearance_, and the two vary independently.
- **Switching:** `hooks/useTheme.ts` stores `t3code:theme`, an appearance mode (`system|light|dark`) and "theme halves". Halves let you pick different themes for light and dark. It resolves against `matchMedia('(prefers-color-scheme: dark)')`, toggles `.dark` on `<html>`, syncs `<meta name="theme-color">`, and briefly adds a `no-transitions` class so colors don't animate during a switch (`useTheme.ts:305-347`). It also listens to `storage` events for cross-tab sync (`:445-455`).
- **No flash:** a blocking inline script in `index.html` repeats the resolution before the app loads. It sets `.dark`, `documentElement.style.backgroundColor` and `theme-color`, and on error falls back to the system preference (`index.html:13-390`).
- **Notable:** user- and agent-imported custom theme CSS goes into an adopted stylesheet, and any declaration that could fetch a URL is stripped "so a url() on an attribute selector can send what is on screen to another host" ([themeCss.ts](https://github.com/pingdotgg/t3code/blob/64d70f8828e840ccd1f0d483499d96e9b42bc99e/apps/web/src/themeCss.ts)). A contrast slider writes `--appearance-contrast-*` variables (`appearanceContrast.ts`). Motion and decorative CSS is gated with `@media (prefers-reduced-motion: no-preference) and (forced-colors: none)`, and sliders revert to native `accent-color: Highlight` in forced colors (`index.css:565,1060`).
- **Takeaways for this site:** keep shadcn names and add `info/success/warning`. Store "system" as a real choice. Run the boot script inline. Suppress transitions while switching. Skip custom themes; nobody asked for them.

---

## 5. Token standards and tiering

- **W3C DTCG Format Module:** the DTCG announced its "First stable version 2025.10" ([designtokens.org](https://www.designtokens.org/)). The 2025.10 report is a **Candidate Recommendation** of a W3C _Community Group_, "not a W3C Standard nor … on the W3C Standards Track" ([2025.10 format](https://www.designtokens.org/tr/2025.10/format/)). Tokens are JSON objects with `$value`, `$type` and `$description`, grouped hierarchically. Aliases reference other tokens, and composite types (e.g. `shadow`) exist. Colors carry `colorSpace` + `components` (e.g. `"colorSpace": "srgb"`). The `/tr/drafts/` page is marked "preview… do not implement" ([drafts](https://www.designtokens.org/tr/drafts/format/)).
- **Style Dictionary:** "Design tokens are the platform-agnostic way to define design decisions, and are the main input for Style Dictionary." v4 accepts both its legacy `value/type/comment` and DTCG `$value/$type/$description` ([SD tokens](https://styledictionary.com/info/tokens/)). It transforms one token source into CSS, iOS, Android and so on.
- **Three tiers.** Systems name the tiers differently but structure them the same way:
  - **Primer:** _base_ tokens "map directly to a raw value… don't respect color modes and should never be used directly in code". _Functional_ tokens "reference base color tokens… and respect color modes" (e.g. `bgColor-default`). _Component/pattern_ tokens cover more specific cases ([Primer color](https://primer.style/foundations/color/overview)).
  - **Material 3:** reference (`ref`), system (`sys`) and component (`comp`) tokens ([M3 design tokens](https://m3.material.io/foundations/design-tokens/overview)). The page renders client-side; my automated read confirmed the ref/sys terms only.
  - **This repo, mapped:** tier 1 primitives (`--color-brand-*`, `--color-sage-*`, Atlas paper/ink, `--social-*`). Tier 2 semantic (`--background`, `--primary`, … , `--color-support`). Tier 3 component (`--radius-card`, `--radius-input`, future `--header-bg`). The rule to adopt: **components use only tiers 2–3, and only tier 2 changes per theme.**

**Synthesis on tooling:** a single website consumed only by Tailwind does not need DTCG JSON plus Style Dictionary. CSS custom properties _are_ the token format here. Add the pipeline only if tokens must also feed Figma (Kumo syncs tokens to a Figma plugin, [Kumo README](https://github.com/cloudflare/kumo)) or a native app.

---

## 6. Lessons from exemplary design systems

**Apple HIG.** Colors should adapt to the appearance: "Semantic colors … automatically adapt to the current appearance". Dynamic system colors are "semantically defined by its purpose, rather than its appearance or color values". Dark Mode uses two background sets, _base_ and _elevated_, so layered surfaces read as depth. Contrast should be at least 4.5:1, and authors should "strive for a contrast ratio of 7:1, especially in small text" ([Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [Color](https://developer.apple.com/design/human-interface-guidelines/color)). _Lesson:_ in dark mode, raised surfaces get _lighter_, not shadowier. Model this as `--card` above `--background`; this repo's `.dark .ui-surface-card { background: var(--muted) }` does it ad hoc.

**Samsung One UI.** The public material is principle-level. One UI is "a comfortable interface" with "four design principles" ([design.samsung.com One UI](https://design.samsung.com/global/contents/one-ui/)). The developer portal publishes guides for large screens and foldables ([Samsung Developer One UI](https://developer.samsung.com/one-ui)). I found no public color-token specification. _Lesson:_ use it for layout ergonomics (reachable controls, large-screen adaptation), not for token naming.

**Cloudflare Kumo.** Kumo is a Base UI–based component library ([cloudflare/kumo](https://github.com/cloudflare/kumo)) with an Astro docs site. Its `AGENTS.md` says: "ONLY semantic tokens: `bg-kumo-base`, `text-kumo-default`, `border-kumo-line`", "NEVER raw Tailwind colors … fails lint", and "NEVER `dark:` variant: dark mode automatic via `light-dark()` in CSS custom properties". It allows `bg-white`/`bg-black`/`text-white`/`text-black`/`transparent` as exceptions ([AGENTS.md](https://github.com/cloudflare/kumo/blob/main/AGENTS.md)). Enforcement is custom lint rules: `no-primitive-colors.js`, `no-tailwind-dark-variant.js`, `lint-astro-colors.js` ([lint/](https://github.com/cloudflare/kumo/tree/main/lint)). Semantic tokens are generated into `theme-kumo.css` as `@theme { --text-color-kumo-default: light-dark(…, …) }`. _Lesson:_ this is the closest match to this repo (Astro, Tailwind v4, Base UI, agents), so copy its enforcement model.

**GitHub Primer.** Primer uses the base → functional → component tiers above. Functional tokens are named by role and property, e.g. `fgColor-*`, `bgColor-*`, `borderColor-*`, so `bgColor-default` changes automatically with the color mode ([Primer color](https://primer.style/foundations/color/overview)). _Lesson:_ forbid tier-1 tokens in code. That makes "is it themeable?" a lint question instead of a review question.

**IBM Carbon.** Carbon ships four themes, white, g10, g90 and g100. "Each theme is assigned universal color variables, which are determined by common roles and usage" ([Carbon themes](https://carbondesignsystem.com/elements/themes/overview/), [color tokens](https://carbondesignsystem.com/elements/color/tokens/)). _Lesson:_ a theme is a complete set of values for one shared set of role names. Never add role names that exist in only one theme.

**Material Design 3.** Color _roles_ come in pairs and containers: `primary` / `on-primary` / `primary-container` / `on-primary-container` ([M3 color roles](https://m3.material.io/styles/color/roles)). _Lesson:_ this matches the pairs this repo already has as `--color-logo-purple` / `-container`. Keep one naming style (shadcn's `-foreground`) and map M3's "container" idea onto `secondary`/`muted`.

**Radix Colors.** Each 12-step scale has fixed semantics. Steps 1–2 are app and subtle backgrounds, 3–5 component backgrounds (normal, hover, active), 6–8 borders, 9–10 solid backgrounds (9 has the highest chroma), and 11–12 text. Steps 11 and 12 "are guaranteed to Lc 60 and Lc 90 APCA contrast" on step 2 of the same scale ([understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)). _Lesson:_ if brand scales are generated (`--color-brand-50…950`), give each step a job so dark mode is a scale swap rather than a re-pick.

**Starlight (Astro's docs theme).** Starlight uses a small set of primitives (`--sl-color-white`, `--sl-color-gray-1…7`, `--sl-color-black`, `--sl-color-accent-low|accent|accent-high`) and _semantic aliases_ (`--sl-color-text`, `--sl-color-bg`, `--sl-color-bg-nav`, `--sl-color-hairline`). It defines dark under `:root` and light under `:root[data-theme='light']`. The light theme mostly **inverts the gray ramp**, so `gray-1` and `gray-6` swap ([props.css](https://github.com/withastro/starlight/blob/main/packages/starlight/src/style/props.css)). Its docs ship a theme editor with a WCAG contrast-level option ([Starlight CSS & Styling](https://starlight.astro.build/guides/css-and-tailwind/)). _Lesson:_ about 10 primitives and about 12 semantic aliases are enough for a whole content site.

---

## 7. Accessibility requirements for themes

- **WCAG 2.2 SC 1.4.3, Contrast (Minimum), AA:** text needs at least 4.5:1, and large-scale text at least 3:1. The ratios are "threshold values" with no rounding ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Check **every** `x`/`x-foreground` pair, plus `muted-foreground` on `background`, `card` and `muted`, in **both** themes.
- **WCAG 2.2 SC 1.4.11, Non-text Contrast:** UI components, their states and meaningful graphics need at least 3:1 "against adjacent color(s)" ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). This covers `--border` on input fields (the dark `--input: oklch(1 0 0 / 15%)` at `tokens.css:134` needs measuring), `--ring` focus indicators, and selected states.
- **`prefers-color-scheme`:** use it as the default when no choice is stored ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)).
- **`color-scheme`:** it sets the canvas, scrollbars, form controls and other browser UI colors. MDN recommends `<meta name="color-scheme">` in `<head>` before CSS to help prevent a flash ([MDN color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)). Set it on `:root`/`.dark` together with the tokens, as T3 Code does, instead of pinning `light`. `light-dark()` resolves from `color-scheme` and is what Kumo uses ([MDN light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)).
- **`forced-colors: active`** (e.g. Windows High Contrast): the browser enforces a user palette exposed through system color keywords such as `Canvas` and `CanvasText`, and sets `prefers-color-scheme` from it ([MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)). Do not rely on background color or box-shadow alone for boundaries or focus. Keep real borders and outlines, and use `Highlight` for accents, as T3 Code does.
- **`prefers-reduced-motion`:** already handled (`src/styles.css:863-880`, plus `MotionToggle`). The theme switch itself must not animate colors when reduced motion is set. Suppress transitions during a switch for everyone (T3 Code's `no-transitions`).
- **No flash of the wrong theme (Astro):** `is:inline` "tells Astro to leave the `<script>` … as-is… not processed, optimized, or bundled", so it runs synchronously where it is placed ([Astro directives](https://docs.astro.build/en/reference/directives-reference/#isinline)). Astro's tutorial uses exactly this for the theme ([Astro tutorial 6-islands/2](https://docs.astro.build/en/tutorial/6-islands/2/)). Tailwind says to put the script "inline in `head` to avoid FOUC" ([Tailwind dark mode](https://tailwindcss.com/docs/dark-mode)), and Starlight's `ThemeProvider.astro` does the same with `starlight-theme` in localStorage ([source](https://github.com/withastro/starlight/blob/main/packages/starlight/src/components/ThemeProvider.astro)). This repo's `src/worker.js:21,62` uses a nonce CSP and stamps nonces on scripts, so an `is:inline` boot script fits the CSP (verify on the preview Worker).

Recommended boot script (Synthesis, adapted from the sources above):

```astro
<script is:inline>
  ;(() => {
    let t = null
    try {
      t = localStorage.getItem('theme')
    } catch {}
    const dark =
      t === 'dark' ||
      (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    root.style.colorScheme = dark ? 'dark' : 'light'
  })()
</script>
```

- **Testing:** axe has a `color-contrast` rule ([axe rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)). Playwright's `colorScheme` option emulates the preference ([Playwright emulation](https://playwright.dev/docs/emulation)). Both are only meaningful once the page honors that preference. Automated passes are bounded evidence, as `docs/accessibility-testing.md` already says.

---

## 8. Making it AI-agent friendly

- **AGENTS.md is the entry point.** It is "a README for agents", and in nested setups "the closest one takes precedence" ([agents.md](https://agents.md/)). Codex reads AGENTS.md files before doing any work and layers global and project files ([Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)). Claude Code documents when it reads AGENTS.md alongside CLAUDE.md, and supports path-scoped rules that load only for matching files ([Claude Code memory](https://code.claude.com/docs/en/memory)). _Apply:_ keep `AGENTS.md` short and link `docs/design-system.md`. Optionally add a nested `src/components/AGENTS.md` with the styling rules so they load where they matter.
- **A design doc agents read.** Google Stitch defines a `DESIGN.md` convention for describing a design system to agents ([Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview); the page renders client-side, so only the title was verified). The shadcn skill treats a DESIGN.md or brand spec as input for building a shadcn design system. _Apply:_ `docs/design-system.md` should contain:
  1. A token table: name → role → light value → dark value → allowed pairs.
  2. "Which token do I use for…": page, card, hover, selected, error, success, link, focus.
  3. A **forbidden list** with the lint message an agent will see.
  4. Layout primitives and when to use each.
  5. A how-to for adding a token, with the shadcn recipe and a contrast check in both themes.
- **Lint beats prose.** Kumo turns each rule into a lint failure: `no-primitive-colors`, `no-tailwind-dark-variant`, `lint-astro-colors` ([Kumo lint](https://github.com/cloudflare/kumo/tree/main/lint)). Stylelint has `color-no-hex` for CSS ([Stylelint](https://stylelint.io/user-guide/rules/color-no-hex)). _Apply:_ extend the existing `scripts/validate-ui-consistency.mjs`; it already has fixtures and a test script, so no new dependency is needed. Rules:
  - no hex/`rgb()`/`hsl()`/raw `oklch()` outside `tokens.css`;
  - no Tailwind palette classes outside an allow-list;
  - no `dark:` outside `src/components/ui/`;
  - no `--color-paper|ink|brand-*` (tier 1) outside `tokens.css`.

  Error messages should name the replacement token.

- **shadcn registry + MCP + skill.** The shadcn MCP server lets assistants "browse, search, and install components from registries" configured in `components.json` ([shadcn MCP](https://ui.shadcn.com/docs/mcp)). The shadcn skill runs `shadcn info --json` and enforces "semantic colors" ([shadcn skills](https://ui.shadcn.com/docs/skills)). Both are already available in this environment. A private registry (`registry.json`) could publish this site's `Section`/`Container`/`ThemeToggle` _and_ its CSS variables so agents install the house versions ([shadcn registry](https://ui.shadcn.com/docs/registry)). That is optional for a single repo.
- **Visual regression.** Storybook visual tests compare snapshots against baselines ([Storybook visual tests](https://storybook.js.org/docs/writing-tests/visual-testing)). Playwright's `toHaveScreenshot` does the same without Storybook ([Playwright](https://playwright.dev/docs/test-snapshots)). _Apply:_ Playwright is already installed, so add per-route light and dark screenshots. Skip Storybook unless a component catalog is wanted.

---

## 9. Reading list

| Title                                                                                                                                                              | Author / publisher                           | Free online?                                                                      | Why read it                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [Atomic Design](https://atomicdesign.bradfrost.com/)                                                                                                               | Brad Frost                                   | **Yes**, full text ([TOC](https://atomicdesign.bradfrost.com/table-of-contents/)) | Atoms → molecules → organisms → templates → pages; vocabulary for the layout-primitive layer |
| [Refactoring UI](https://www.refactoringui.com/)                                                                                                                   | Adam Wathan & Steve Schoger                  | No (book); some free articles on the site                                         | Practical color, spacing, hierarchy and depth; from the Tailwind authors                     |
| [Every Layout](https://every-layout.dev/)                                                                                                                          | Heydon Pickering & Andy Bell                 | Partly (layout descriptions online; full book paid)                               | Stack, Cluster, Sidebar, Switcher, Center: intrinsic layout primitives that map to (d)       |
| [Design Systems](https://www.smashingmagazine.com/design-systems-book/)                                                                                            | Alla Kholmatova / Smashing Magazine          | No                                                                                | Functional vs perceptual patterns; how teams keep a shared language                          |
| [Don't Make Me Think, Revisited](https://sensible.com/dont-make-me-think/)                                                                                         | Steve Krug                                   | No                                                                                | Usability basics for navigation and page scanning                                            |
| [Laws of UX](https://lawsofux.com/)                                                                                                                                | Jon Yablonski                                | **Yes** (site); book via O'Reilly                                                 | Short, citable heuristics (Hick, Fitts, Jakob)                                               |
| [The Design of Everyday Things](https://mitpress.mit.edu/9780262640374/the-design-of-everyday-things/)                                                             | Don Norman / Basic Books (MIT Press edition) | No                                                                                | Affordances, signifiers and feedback; the foundation for interaction states                  |
| [Primer](https://primer.style/), [Carbon](https://carbondesignsystem.com/), [Material 3](https://m3.material.io/), [Radix Colors](https://www.radix-ui.com/colors) | GitHub, IBM, Google, WorkOS                  | **Yes**                                                                           | Living references for token tiers, themes and color scales                                   |

(The Smashing and MIT Press links were not fetchable by the automated reader. The A Book Apart URL I tried returned 404, so the publisher page above is linked from memory and should be verified.)

---

## 10. Sources

**shadcn / Tailwind / Astro**

- https://ui.shadcn.com/docs/theming (source: https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/(root)/theming.mdx)
- https://ui.shadcn.com/docs/dark-mode/astro (source: …/dark-mode/astro.mdx)
- https://ui.shadcn.com/docs/mcp · https://ui.shadcn.com/docs/skills · https://ui.shadcn.com/docs/registry
- https://tailwindcss.com/docs/dark-mode · https://tailwindcss.com/docs/theme
- https://docs.astro.build/en/reference/directives-reference/#isinline · https://docs.astro.build/en/tutorial/6-islands/2/
- https://starlight.astro.build/guides/css-and-tailwind/ · https://github.com/withastro/starlight/blob/main/packages/starlight/src/style/props.css · https://github.com/withastro/starlight/blob/main/packages/starlight/src/components/ThemeProvider.astro

**T3 Code** (commit `64d70f8828e840ccd1f0d483499d96e9b42bc99e`)

- https://github.com/pingdotgg/t3code/blob/64d70f8828e840ccd1f0d483499d96e9b42bc99e/apps/web/src/index.css
- …/apps/web/src/hooks/useTheme.ts · …/apps/web/index.html · …/apps/web/src/themeCss.ts · …/apps/web/src/appearanceContrast.ts

**Token standards**

- https://www.designtokens.org/ · https://www.designtokens.org/tr/2025.10/format/ · https://www.designtokens.org/tr/drafts/format/ · https://www.w3.org/community/design-tokens/
- https://styledictionary.com/info/tokens/

**Design systems**

- https://developer.apple.com/design/human-interface-guidelines/dark-mode · https://developer.apple.com/design/human-interface-guidelines/color
- https://design.samsung.com/global/contents/one-ui/ · https://developer.samsung.com/one-ui
- https://github.com/cloudflare/kumo · https://github.com/cloudflare/kumo/blob/main/AGENTS.md · https://github.com/cloudflare/kumo/tree/main/lint (commit `eaa9e17`) · https://kumo-ui.com/
- https://primer.style/foundations/color/overview
- https://carbondesignsystem.com/elements/themes/overview/ · https://carbondesignsystem.com/elements/color/tokens/
- https://m3.material.io/foundations/design-tokens/overview · https://m3.material.io/styles/color/roles
- https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale

**Accessibility**

- https://www.w3.org/TR/WCAG22/ · https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html · https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme · https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme · https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark · https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors · https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md · https://playwright.dev/docs/emulation · https://playwright.dev/docs/test-snapshots

**Agents and tooling**

- https://agents.md/ · https://developers.openai.com/codex/guides/agents-md · https://code.claude.com/docs/en/memory · https://www.anthropic.com/engineering/claude-code-best-practices
- https://stitch.withgoogle.com/docs/design-md/overview
- https://stylelint.io/user-guide/rules/color-no-hex · https://storybook.js.org/docs/writing-tests/visual-testing

**Books:** see §9.
