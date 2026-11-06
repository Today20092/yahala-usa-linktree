# Development font comparison

Date: 2026-11-05.

## Accepted choice

The owner chose Manrope throughout. The temporary selector and its browser test have been removed. Headings, body text, navigation, and controls now use the same self-hosted variable font in development and production builds. The font file is about 24 KB and includes weights 200 through 800. Its OFL license is in `public/licenses/manrope.txt`. Page-title weight is 800 so the browser does not need to synthesize a heavier weight. Arabic continues to use the browser's script fallback.

After acceptance, build, cached accessibility lint, UI consistency validation, and `test:atlas-polish` passed. `node scripts/test-fonts.mjs` verifies real local font loading, all four routes, heading/body/control roles, 320px and 1280px widths, light/dark states, removal of the comparison UI, and absence of previous font requests. The first run against the starting preview server did not find the font; a subsequent diagnostic confirmed the local font face loaded, and the repeated full font check passed. Desktop and 320px About screenshots were inspected. Impeccable's detector returned no findings.

The new full production accessibility matrix still has 22 passes and the same eight failures seen before acceptance. Six expect the old homepage CTA label. Two report a mobile contact-form target-size failure after the interaction flow. Those failures are outside the font change and remain unresolved. No production deployment was performed. Screen-reader testing, physical mobile checks, Arabic font matching, and actual browser zoom remain incomplete.

## Earlier comparison

The running Astro development server has a labeled native font selector above the shared navigation. It offers Manrope, Plus Jakarta Sans, Source Sans 3, and DM Sans throughout, plus Lora or Fraunces headings with Jakarta body text. Original fonts restores the stylesheet defaults. Session storage remembers the choice between routes. Blocked storage does not prevent switching on the current page.

The component only renders in development. Production HTML for all four routes contains neither the selector nor its Google Fonts stylesheet. Preview fonts use Google Fonts during development; the permanent site retains its existing font delivery.

## Executed checks

- Build and UI consistency validation passed.
- Cached accessibility source lint passed.
- `node scripts/test-font-preview.mjs` passed. It verifies all six actual font loads, heading/body assignments, 320px page reflow, keyboard selection, persistence across all four routes, Original reset, an axe scan of the selector, and production exclusion.
- Astro check finished with zero errors and warnings. It reported 186 hints, mostly from generated accessibility-report JavaScript included by the existing TypeScript configuration.
- The development browser confirmed Manrope and Jakarta switch both heading and body families. Manrope loaded at weights 400, 600, 700, and 800. The Tailscale development health endpoint returned `{"ok":true}`.
- Impeccable's detector flagged Fraunces as commonly used. It is an explicit comparison choice, not an unexamined permanent font decision.
- The full production accessibility matrix completed with 22 passes and 8 failures. Six homepage cases could not find the expected old `Connect with Ya Hala` link label, and two mobile contact-interaction cases failed. These remain unresolved in this font-preview task. Production does not contain the selector, its script tag, or its font stylesheet. No assertion baselines were changed.

## Limits

The production matrix does not exercise the development selector; the dedicated browser check covers that interaction. Full visual review of every font across every route, Arabic fallback pairing, real screen-reader use, physical mobile devices, and actual 400% browser zoom remain unchecked. No production deployment was performed. The development server remains running for the user's comparison.
