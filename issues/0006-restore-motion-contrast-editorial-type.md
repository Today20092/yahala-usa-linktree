---
status: open
triage: ready-for-agent
branch: feature/brand-collaborations
---

# 06 — Restore metric motion, accessible contrast, and editorial type

## Context

The light Atlas preview exposed three regressions on mobile:

- The “People reached” total renders its final value but does not count upward.
- Several controls lose readable foreground/background contrast, including the
  “Latest episode” action, the map loading state, and the “Find stories near
  you” map-pin badge.
- The approved editorial display voice was lost when production Atlas tokens
  were consolidated.

The earlier editorial family is **Newsreader**, introduced in commit `60e6b61`
and previously assigned to `--font-display`. Restore Newsreader for editorial
headings/display numbers while retaining Plus Jakarta Sans for body copy and
interface controls.

## Branch strategy

Continue on `feature/brand-collaborations` as a separate follow-up commit. This
ticket fixes regressions found while manually reviewing that branch's shared
Atlas preview, so a second feature branch would add merge overhead without
isolating independent work.

## Acceptance criteria

- [ ] The “People reached” total counts from zero to its verified value once
      when the section enters the viewport, respects reduced-motion settings,
      and retains a server-rendered final-value fallback.
- [ ] “Latest episode,” map loading/error states, and the “Find stories near
      you” icon remain legible in the production light Atlas theme, including
      before and after client hydration.
- [ ] Normal text and essential icons at the affected surfaces meet WCAG AA
      contrast (4.5:1 for normal text and 3:1 for large text/UI graphics).
- [ ] Newsreader is restored as the shared editorial display font for headings
      and headline metrics; Plus Jakarta Sans remains the body/UI font.
- [ ] Home, About, and Stories retain consistent light-theme typography and
      color behavior at mobile and desktop widths.
- [ ] A regression check covers metric enhancement plus the affected
      foreground/background token pairs without adding a CSS parser dependency.
- [ ] The production build, UI validation, relevant component tests, and live
      preview smoke test pass.

## Dependencies

- [0005 — Deepen automated UI consistency validation](0005-deepen-ui-consistency-validation.md)
