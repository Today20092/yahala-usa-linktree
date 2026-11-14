# Design system

Reference for colors, layout primitives and themes. Read it before adding color, a surface, or page layout. [UI consistency](ui-consistency.md) covers shared components and typography; [accessibility testing](accessibility-testing.md) covers rendered checks.

## Tokens

The token file is the source of truth: root `tokens.css` today, or `src/styles/tokens*.css` / `src/styles/theme*.css` once tokens move there. Both checkers below read whichever exist. Light values live on `:root`; dark values override them under `.dark`. `@theme inline` exposes each `--x` to Tailwind as `bg-x`, `text-x`, `border-x`, `ring-x`, `fill-x`.

The table is a snapshot from November 2026. When a token changes or is added (for example `--success`, `--warning`, `--info`), update its row; `npm run test:contrast` prints the resolved pairs.

| Token                                           | Light                                                      | Dark                                                       | Use                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `--background` / `--foreground`                 | `oklch(1 0 0)` / `oklch(0.147 0.004 49.25)`                | `oklch(0.147 0.004 49.25)` / `oklch(0.985 0.001 106.423)`  | Page surface and body text                                           |
| `--card` / `--card-foreground`                  | same as background                                         | `oklch(0.216 0.006 56.043)` / `oklch(0.985 0.001 106.423)` | Card and panel shells (`ui-surface-card`)                            |
| `--popover` / `--popover-foreground`            | same as card                                               | same as card                                               | Menus, popovers, dialogs                                             |
| `--primary` / `--primary-foreground`            | `oklch(0.58 0.21 21)` / `oklch(1 0 0)`                     | `oklch(0.695 0.195 23.657)` / `oklch(0.147 0.004 49.25)`   | Brand actions, links, `text-primary`; foreground sits on brand fills |
| `--secondary` / `--secondary-foreground`        | `oklch(0.94 0.035 282.737)` / `oklch(0.306 0.101 282.737)` | `oklch(0.306 0.101 282.737)` / `oklch(1 0 0)`              | Logo-purple secondary buttons and chips                              |
| `--muted` / `--muted-foreground`                | `oklch(0.97 0.001 106.424)` / `oklch(0.553 0.013 58.071)`  | `oklch(0.268 0.007 34.298)` / `oklch(0.709 0.01 56.259)`   | Quiet fills; secondary text, captions, metadata                      |
| `--accent` / `--accent-foreground`              | `oklch(0.97 0.001 106.424)` / `oklch(0.216 0.006 56.043)`  | `oklch(0.268 0.007 34.298)` / `oklch(0.985 0.001 106.423)` | Hover and selected fills in menus and lists                          |
| `--destructive`                                 | `oklch(0.577 0.245 27.325)`                                | `oklch(0.704 0.191 22.216)`                                | Errors, invalid fields, destructive actions                          |
| `--border`                                      | `oklch(0.923 0.003 48.717)`                                | `oklch(1 0 0 / 10%)`                                       | Decorative dividers and card edges only                              |
| `--input`                                       | `oklch(0.923 0.003 48.717)`                                | `oklch(1 0 0 / 15%)`                                       | Form control boundaries (must reach 3:1)                             |
| `--ring`                                        | `oklch(0.597 0.223 20.955)`                                | `oklch(0.695 0.195 23.657)`                                | Focus indicators                                                     |
| `--color-shadow` / `--color-scrim`              | `oklch(0.147 0.004 49.25)`                                 | `oklch(0 0 0)`                                             | Shadow color (mix with `transparent`) and modal overlays             |
| `--color-support` / `--color-support-container` | sage 600 / sage 50 mix                                     | sage 300 / sage 950                                        | Success and support states until a `--success` token exists          |
| `--social-*`                                    | fixed                                                      | `--social-*-dark`                                          | Platform brand marks only                                            |

`--color-brand-*` and `--color-sage-*` are palette steps that semantic tokens reference. Components use the semantic token, not the step. The `.partnership-section` scope remaps the semantic set to the Atlas paper/ink palette; that remap is light-only.

## Which token for what

- Text: `text-foreground`; secondary text `text-muted-foreground`; text on a brand fill `text-primary-foreground`; errors `text-destructive`.
- Surfaces: page `bg-background`; cards `bg-card` or `ui-surface-card`; quiet panels `bg-muted`; hover/selected `bg-accent`.
- Edges: dividers `border-border`; inputs, selects and checkboxes `border-input`; focus `ring-ring` / `outline-ring`.
- Overlays: `bg-(--color-scrim)/40`. Shadows: `color-mix(in oklch, var(--color-shadow) N%, transparent)` or an existing elevation class.
- Tints: `bg-primary/10` or `color-mix(in oklch, var(--primary) N%, transparent)`. Repeated tints become a named token.

## Do and don't

- Do reference a semantic token for every color, in classes, CSS and inline styles.
- Do add a new token to the token file with a light and a dark value, then run `npm run test:contrast`. A `--x` with `--x-foreground` is checked automatically; add other pairs to `PAIRS` in `scripts/test-token-contrast.mjs`.
- Do use one class that works in both themes. A `dark:` color variant means a token is missing.
- Don't use hex, `rgb()`, `hsl()` or `oklch()` literals, Tailwind palette classes (`bg-white`, `text-black`, `*-gray-500`, `*-red-*`), or arbitrary values (`bg-[#…]`, `text-[rgb(…)]`) outside the token file.
- Don't use `--border` as the only boundary of a control; it is below 3:1 by design.

## Forbidden colors and lint messages

`npm run validate:ui` (rules in `scripts/ui-color-rules.mjs`) scans every `.astro`, `.ts`, `.tsx`, `.js`, `.jsx` and `.css` file under `src/`. Comment lines and token files are skipped. Each finding prints `file:line:` and one of these messages:

| Finding         | Message                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Arbitrary value | `arbitrary color value "bg-[#123456]". <literal hint>`                                                        |
| Palette class   | `Tailwind palette class "text-white". Use text-primary-foreground on brand fills, otherwise text-background.` |
| Color function  | `raw color function "oklch(…)". <literal hint>`                                                               |
| Hex literal     | `raw hex color "#4285F4". <literal hint>`                                                                     |

The literal hint reads: `Use var(--token) from the token file: --foreground/--background for text and page, --muted-foreground for secondary text, --border/--input for edges, --primary for brand actions, --destructive for errors, and color-mix(in oklch, var(--color-shadow) N%, transparent) for shadows or var(--color-scrim) for overlays.`

Palette-class suggestions by hue:

| Hue                           | `bg-`                                                           | `border-` / `ring-` / `outline-` / `divide-`       | `text-` / `fill-` / `stroke-`                                       |
| ----------------------------- | --------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| white                         | `bg-background or bg-card`                                      | `border-background`                                | `text-primary-foreground on brand fills, otherwise text-background` |
| black                         | `bg-(--color-scrim)/40 for overlays, otherwise bg-foreground`   | `border-foreground`                                | `text-foreground`                                                   |
| slate/gray/zinc/neutral/stone | `bg-muted`                                                      | `border-border, or border-input for control edges` | `text-muted-foreground`                                             |
| red/rose                      | `bg-destructive for errors, otherwise bg-primary`               | same pattern                                       | same pattern                                                        |
| other hues                    | `bg-primary or another semantic token in docs/design-system.md` | same pattern                                       | same pattern                                                        |

### Exceptions

A literal that cannot be a token (a canvas or raster API that cannot read CSS variables) carries `ui-color-allow: <reason>` on the same line or the line above. The reason is required; a bare marker still fails. Current exceptions: MapLibre paint defaults in the vendored `src/components/ui/map.tsx`, and the QR raster colors in `src/components/QrCodeButton.astro`.

## Contrast gate

`npm run test:contrast` (`scripts/test-token-contrast.mjs`, run in CI) resolves tokens for light and dark and asserts WCAG 2.2 AA:

- 4.5:1 for every `--x-foreground` on `--x`, `--foreground`, `--muted-foreground`, `--primary` and `--destructive` on page and card.
- 3:1 (1.4.11) for `--ring` and `--input` on page and card.
- `--border` on page prints a `note` without failing: decorative edges are exempt.

It assumes flat backgrounds and composites alpha tokens over the background. Rendered states (hover, gradients, images) stay with the Playwright axe gate. Forced-colors checks remain in `npm run test:a11y`.

## Layout primitives

Pages compose these instead of hand-rolled wrappers and gutters. They are being built in parallel; confirm props in the component source before use.

| Primitive    | Intended API                                                                        | Replaces                                  |
| ------------ | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| `Container`  | Centered 76rem shell with 20–32px responsive gutters; `size` for narrower prose     | Per-page `max-w-*` + `mx-auto` + `px-*`   |
| `Section`    | Vertical rhythm block with `id` and optional `aria-labelledby`; wraps a `Container` | Ad hoc `py-*` section wrappers            |
| `PageHeader` | Kicker, `ui-page-title` h1 and lead paragraph                                       | Repeated hero heading markup              |
| `Stack`      | Vertical flex with a `gap` from the space scale                                     | `flex flex-col gap-*` and margin stacking |
| `Cluster`    | Wrapping horizontal flex with `gap`, `align`, `justify`                             | Button rows, chip and badge groups        |

## Themes

- Dark mode is class-based: `.dark` on `<html>` activates the dark token set, and `@custom-variant dark (&:is(.dark *))` drives any `dark:` variant.
- Apply the stored or system preference with an inline script in `<head>` before first paint, so no route flashes the wrong theme. The theme switcher owns that state; components never hard-code `light` or `dark`.
- `color-scheme` and `<meta name="theme-color">` follow the active theme.
- Every route must look equivalent in both themes. After token or theme changes, run `npm run test:contrast`, `npm run validate:ui`, and the extended accessibility matrix (`npm run test:a11y:full`).
