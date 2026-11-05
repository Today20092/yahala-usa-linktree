# Shared navigation verification

November 5, 2026. Scope: primary navigation on Home, About, and Stories. Target: consistent navigation and WCAG 2.2 AA accessibility; this focused change does not establish whole-site conformance.

## Changes and reference

The homepage had five navigation destinations, while About and Stories had a different three-link header. `BrandedPageDocument` now renders `EditorialHeader` once for every route. `LandingNavigation` owns the five labels, their order and current-page state. Watch, Follow and Contact link to Home sections from every page; the brand links Home.

This follows [Astro's layout composition](https://docs.astro.build/en/basics/layouts/) and [component scripts](https://docs.astro.build/en/guides/client-side-scripts/), checked through Context7 and a successful live Astro Docs MCP search. Navigation uses the existing Base UI wrappers and semantic site tokens. [Consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html) and [focus visibility](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) inform the shared behavior.

Mobile navigation hides after deliberate downward scrolling and returns on upward scrolling or focus. Small scroll jitter is ignored. Desktop and reduced-motion navigation remain visible. Header measurement supplies anchor clearance as text or viewport size changes. The skip link has a visible focus treatment above the header.

## Executed checks

- `npm run check`, `npm run build`, `npm run validate:ui`, and `npm run smoke:preview -- dist` passed.
- Navigation regression, branded document, accessibility, branch workflow, Atlas polish and dependency-automation checks passed. The navigation test exercises scroll direction, jitter, focus, reduced motion, top overscroll and breakpoint changes; CI now runs it.
- Rendered DOM checks covered all three routes at phone width, including identical link order, real destinations, current-page states, and 44px-high links. At 320px, the five links fit one row without horizontal overflow.
- At 320px, 200% root text combined with line-height 1.5, letter spacing 0.12em and word spacing 0.16em left all header links inside its bounds. Brand wrapping corrected an overflow found by this check.
- Intermediate 768px and desktop 1280px layouts had no horizontal overflow; desktop navigation stayed visible after a scroll event.
- The rendered light-theme text/background contrast measured approximately 12.89:1; the focus token against the header background measured approximately 4.79:1, using browser canvas sRGB conversion.
- Home's Watch anchor remained below the sticky header. Programmatic focus restored hidden navigation immediately.

## Limits

Preview screenshots failed twice with `Preview automation snapshot timed out after 15000ms`; the alternate browser provider reported `The browser access host is unavailable`. Visual screenshot review therefore remains incomplete. The automation tab was backgrounded: scroll handlers were also exercised with dispatched scroll events, and animation was temporarily disabled when measuring its final hidden position; those overrides were removed. These checks do not establish physical touch behavior or animation quality.

Real-device, screen-reader, actual 400% browser zoom, end-to-end keyboard activation, forced-colors rendering and browser-level reduced-motion emulation remain unverified. Reduced-motion logic is regression-tested; forced-colors and motion CSS are implemented but not claimed as browser-tested. The site intentionally uses the existing light Atlas theme.

No production deployment is part of this change.
