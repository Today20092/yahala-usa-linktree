# UI Consistency Rule

This site uses a single visual system for repeated UI.

## Rules

- Repeated UI must use shared primitives, shared tokens, or shared utilities.
- Do not invent new button, badge, chip, card, or media-overlay treatments in page components.
- Do not use one-off hex colors, ad hoc shadow stacks, or custom radii when a token or shared class exists.
- If a pattern needs a special brand treatment, isolate it in a shared component first, then reuse that component everywhere.
- Light and dark mode should be visually equivalent, not two unrelated implementations.

## Shared Primitives

- `BrandedPageDocument` renders `EditorialHeader` once on every public route. Keep primary navigation labels and order in `LandingNavigation`; section links return to Home from other routes. The mobile header hides on deliberate downward scrolling and returns on upward scrolling or keyboard focus. Desktop and reduced-motion navigation stay visible.

- `Button` for action buttons.
- `Badge` for small status labels.
- `IconBadge` for repeated icon bubbles, play markers, and icon chips.
- `ui-surface-card` for recurring card shells and content panels.
- Headings use `ui-page-title` (page h1), `ui-section-title` (section h2), `ui-card-title` (card or panel heading) and `ui-kicker-accent` (eyebrow), without size, weight or tracking overrides. `npm run validate:ui` flags h1-h3 without one of the title classes.

## Review Checklist

- Does this pattern already exist somewhere else on the site?
- If yes, did I reuse the shared primitive instead of adding a new one-off style?
- Does the component use design tokens instead of a custom hex, shadow, or radius?
- Does the result look the same in light and dark mode?
- If this is an exception, is the exception documented in the shared primitive instead of inline?

## Guardrail

Commands, setup, and the fast/manual review split live in [accessibility testing](accessibility-testing.md). Use that workflow after UI changes and before handoff.

After UI changes, apply the `web-ui-accessibility` skill to the changed routes, affected shared consumers, and relevant states. Measure rendered text and control contrast, including hover/focus/selected states; check keyboard access, validation and recovery, 320px reflow, text resizing/spacing, and supported themes. Record executed checks and unavailable manual/device checks beside the work. Source inspection and passing builds alone do not complete the accessibility review.

Use automated browser accessibility scans and focused regression assertions when available. Treat scanner passes as bounded evidence, and review incomplete results. Automated checks do not replace the skill’s manual usability and accessibility checks.

Run `npm run validate:ui` before merge. It catches the highest-risk drift patterns, especially raw play/media icons and accidental one-off surface styling in page components.
