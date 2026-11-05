# accordion

2026-11-05, golden pair via CLI with customization replay: migrated to Base UI Accordion with existing shell, padding and icon treatment preserved.

## Changed

- `src/components/ui/accordion.tsx:1`: imports real Base UI Accordion primitives; wrapper props use the installed Root, Item, Trigger and Panel types.
- `src/components/ui/accordion.tsx:64`: the public AccordionContent wrapper now renders Panel. Removed the Radix height variable and ineffective closed-state mount animation; the inner div transitions Base UI panel height using the Panel's starting/ending state through group selectors. Reduced motion disables this transition.
- Trigger disabled styling follows Base UI's `aria-disabled` attribute. Existing aria-expanded icon switching and data-slot hooks remain.
- Inspected both `radix-rhea/accordion` and `base-rhea/accordion` with the CLI, plus installed Panel declarations. Preserved local imports, formatting-independent classes and resolved Lucide icons. The registry's stale `data-closed` animation was not retained because Base UI Panel does not emit that attribute.
- Exhaustive source literal search found no app Accordion consumers. Leftover scan for `radix-ui`, `@radix-ui` and `IconPlaceholder` on this component is clean. `npx tsc --noEmit` passed after migration.

## Left alone

- No application pages currently instantiate this wrapper, so no sample accordion or new page was added.
- Non-Radix primitives and Vaul drawer remain outside this component migration.

## Behavior changes

- Base UI values/defaultValues are arrays, even for single expansion; multiple expansion uses `multiple`, replacing Radix `type`. Base single mode is collapsible by default; Radix's non-collapsible single default is not emulated.
- `forceMount` becomes `keepMounted`, and primitive composition uses `render`. No existing app caller depends on these changed props.
- Base UI Accordion follows its own keyboard behavior; Radix orientation/roving-focus behavior is not reimplemented.
- Panel motion now uses actual Base UI starting/ending state and panel height rather than the old Radix mount animation classes.

## Verify by hand

- In an Accordion fixture, use array defaultValue, expand/collapse an item by Enter/Space, and confirm aria-expanded, heading association and panel visibility agree.
- Confirm disabled items cannot activate and look disabled; check single and multiple modes.
- Check panel expansion/collapse, `keepMounted` and reduced-motion behavior, including focus visibility on the trigger.
