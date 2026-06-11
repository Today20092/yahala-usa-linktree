# UI Consistency Rule

This site uses a single visual system for repeated UI.

## Rules

- Repeated UI must use shared primitives, shared tokens, or shared utilities.
- Do not invent new button, badge, chip, card, or media-overlay treatments in page components.
- Do not use one-off hex colors, ad hoc shadow stacks, or custom radii when a token or shared class exists.
- If a pattern needs a special brand treatment, isolate it in a shared component first, then reuse that component everywhere.
- Light and dark mode should be visually equivalent, not two unrelated implementations.

## Shared Primitives

- `Button` for action buttons.
- `Badge` for small status labels.
- `IconBadge` for repeated icon bubbles, play markers, and icon chips.
- `ui-surface-card` for recurring card shells and content panels.

## Review Checklist

- Does this pattern already exist somewhere else on the site?
- If yes, did I reuse the shared primitive instead of adding a new one-off style?
- Does the component use design tokens instead of a custom hex, shadow, or radius?
- Does the result look the same in light and dark mode?
- If this is an exception, is the exception documented in the shared primitive instead of inline?

## Guardrail

Run `npm run validate:ui` before merge. It catches the highest-risk drift patterns, especially raw play/media icons and accidental one-off surface styling in page components.
