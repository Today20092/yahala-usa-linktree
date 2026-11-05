# button

2026-11-05, golden pair via CLI / manual merge, migrated to the real Base UI Button while preserving the customized Rhea classes.

## Changed

- `src/components/ui/button.tsx`: compared the installed wrapper with the `radix-rhea` golden (customized: 3508 vs 2976 characters before migration), then inspected `base-rhea`. Replaced Radix Slot/asChild with `@base-ui/react/button` and its props. Kept the existing variants, sizes, data attributes, focus styling and transitions; className callbacks compose with those styles.
- `src/components/SocialLinkButton.tsx`: anchor composition now uses `render`, `nativeButton={false}` and `role="link"`; href, external-link attributes, children, description and accessible name are preserved.
- `src/components/VideoSearch.tsx`: result navigation uses the same anchor composition, retaining the result-specific accessible label and explicit submit button.
- `src/components/StoryMap.tsx`: popup destination uses the same anchor composition; the alternate filter command remains a native button.
- Leftover scan `rg -n "radix-ui|@radix-ui|IconPlaceholder|asChild"` on these four files returned no matches.

## Left alone

- Other ordinary Button consumers (`StoryBrowser.tsx` and `ui/map.tsx`) have no asChild or primitive-specific props to migrate.
- CVA variants and project tokens were retained rather than accepting unrelated upstream registry styling drift.
- Concurrent social-link description, new-tab announcement and arrow icon changes were preserved.
- Vaul drawer and map-library wrappers are outside this component migration.

## Behavior changes

- Base UI defaults native buttons to `type="button"`; the old raw button had the browser's implicit submit default. Existing search form submission already sets `type="submit"`, so no current implicit submit action was found that needs preservation.
- Rendered navigation explicitly retains link semantics instead of Base UI's default non-native button role.

## Verify by hand

- Tab to each social link and confirm its name, visible focus, destination and new-tab behavior.
- Submit a transcript query with Enter; while loading, confirm duplicate submission stays disabled. Open a result with Enter and confirm normal link behavior.
- Open a map popup: verify the home destination navigates, while the story-catalog callback button updates filters.
- Verify disabled ordinary buttons cannot activate and map zoom/fullscreen commands still work.

Executed: TypeScript check, production build and search request/accessibility regression passed. The central migration test covers rendered semantics; browser/assistive-technology checks are not claimed here.
