# Project migration to Base UI

2026-11-05 — whole-project migration on `refactor/base-ui-migration`.

## Scope and baseline

Checkpoint `8788034` preserves the existing map, brand asset and UI changes before migration. The baseline production build passed; existing Vite plugin deprecation and large-chunk warnings are unrelated. TypeScript `tsc --noEmit --pretty false` passed after adding Base UI alongside Radix and before wrapper migration.

Three direct Radix wrappers require migration: Button, Badge and Accordion. The parent verified the indexed caller graph and scoped coverage, then workers checked source and stock radix-rhea/base-rhea pairs. Local styling is preserved instead of bulk replacing components.

## Configuration and dependencies

shadcn style changes from `radix-rhea` to `base-rhea`. Existing aliases, tokens, Astro/React setup and the `@animate-ui` and `@cnippet` registries remain. npm manages dependency and lockfile updates. Base UI 1.9.0 was installed alongside Radix during migration; the direct `radix-ui` dependency was removed after all three wrappers migrated. This removed 45 installed packages. npm's audit count remained 35 before/after direct Radix removal; dependency remediation is outside this migration.

## Intentionally unchanged

Vaul Drawer remains a Vaul wrapper, as required by the migration skill. Its transitive Radix dependencies may remain; no application wrapper should directly import Radix after migration. Card, Input, Empty, Skeleton and IconBadge do not use Radix and retain their implementations. Native HTML QR dialog and Astro sections need no primitive conversion. No Cnippet UI components are installed as part of this primitive migration.

## Consumer and behavior review

Button consumers include social navigation, story-map destinations, search result links, story pagination and map controls. Three `asChild` links migrate to Base `render`, with native anchor destinations and link roles. Ordinary form submit actions already specify `type="submit"`; Base UI defaults other buttons to `type="button"`. Accordion has no current application consumers; its public value model becomes arrays and multiple expansion uses `multiple`, matching Base UI. Badge retains custom-render composition through Base helpers.

## Final verification

Completed worker integration and parent review. Per-component reports contain concrete changes and manual QA steps.

- `npm run test:base-ui` passed after direct Radix removal. It renders real bundled project components with shared React server rendering: native/disabled/submit Button semantics, anchor composition and link roles, actual SocialLinkButton destination/name, Badge rendering/prop merge, Accordion controlled single/multiple arrays, disabled state, trigger/panel label associations and mounted collapsed content. It recursively checks source for remaining direct Radix imports, old composition props and CSS variables. The test uses the existing transitive esbuild dependency, without adding a test package.
- `npx tsc --noEmit --pretty false` passed after final migration and dependency removal.
- `npm run build`, `npm run validate:ui` (53 files) and `npm run test:ui-validation` passed. Existing baseline Vite deprecation and chunk-size warnings remain.
- Existing visited-map and story-map checks, search request/accessibility behavior, branded-document, Atlas polish, reach-chart and motion-toggle tests passed after wrapper integration.
- `npm ls @base-ui/react radix-ui --depth=0` reports only Base UI 1.9.0. The direct Radix umbrella dependency is absent; Vaul's implementation remains intentionally unchanged.
- The managed development server remains on port 4321, including its existing Tailscale binding. No deployment or push was performed.
- Concurrent LandingNavigation and navigation-menu changes are already based on Base UI and pass the integrated typecheck/build. Their files, home-page edits and a new map registry entry were preserved without including them in migration commits. Concurrent SocialLinkButton description/new-tab text/icon updates share the migrated caller and were preserved in its component commit.

No real browser keyboard/focus, real mobile or screen-reader verification was executed for this migration. SSR proves initial markup and state, not live interaction. No application Accordion consumers exist, so its keyboard/motion QA is listed in `.migration/accordion.md` rather than claimed as executed.

Derived final source scan: **0 wrappers remain on Radix**.
