# badge

2026-11-05, golden pair via CLI with customization replay: migrated to Base UI composition while preserving the local pill radius and all variants.

## Changed

- `src/components/ui/badge.tsx:1`: replaced Radix Slot with Base UI `useRender` and `mergeProps`, using the inspected `base-rhea/badge` registry shape. `render` replaces `asChild`; state supplies the existing `data-slot` and `data-variant` hooks.
- Compared current source against both `radix-rhea/badge` and `base-rhea/badge` via `shadcn view`. Retained the local `rounded-4xl` customization, import alias and existing variant classes rather than adopting the stock `rounded-2xl`.
- Exhaustive source literal sweep found Badge consumers in StoryBrowser and VideoSearch, none using `asChild`; no consumer edits required. Those callers retain ordinary span semantics.
- Leftover scan for `radix-ui`, `@radix-ui` and `IconPlaceholder` on this component is clean. `npx tsc --noEmit` passed after migration.

## Left alone

- StoryBrowser and VideoSearch Badge usage already matches the new API.
- Other UI primitives and the Vaul drawer are owned by separate migration work or intentionally retain their independent library.

## Behavior changes

- Polymorphic composition now uses Base UI `render` instead of Radix `asChild`; installed consumers do not use the changed prop.
- Render-element and wrapper handlers/styles/classes are merged by Base UI instead of Radix Slot. Native default badge remains a span.

## Verify by hand

- Check New badges in Stories and language/timestamp badges in search results retain the pill shape and colors.
- For a custom linked Badge, provide `render={<a href="…" />}` and confirm href, keyboard focus, text and wrapper/render-element classes remain on one anchor.
