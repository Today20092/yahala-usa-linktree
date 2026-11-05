# shadcn registry survey for YaHala

Research date: **2026-11-05**. Scope: free or open-source premade components, especially blocks and layouts, for YaHala's Astro + React + Tailwind + shadcn landing page (`/`), About page (`/about`), and filterable Story Browser (`/stories`).

## Findings and recommended starting point

Start with **Shadcn Space's explicitly free blocks**, **Tailark's MIT OSS collection**, **Kibo UI**, and **coss UI (formerly Origin UI)**. They cover the useful work: creator link hubs, editorial page sections, destination galleries, story/media presentation, and filtering controls. Use official shadcn blocks as the conservative foundation. Magic UI, Cult UI, Kokonut UI and Eldora UI are useful selective additions, rather than complete page systems.

**Free to download is different from OSI open source.** Current LICENSE files for Animate UI, React Bits and Shadcn Studio add restrictions to MIT text. Aceternity uses a custom license. Shadcnblocks has free items under its own terms alongside paid items. None should be described as an entirely MIT/open-source catalog.

This is a complete **directory metadata survey**, followed by a bounded first-party shortlist investigation. It is not an individual license audit of 539 libraries.

## Coverage and reproducible inventory

Primary directory sources:

- [Human-facing shadcn directory](https://ui.shadcn.com/docs/directory).
- [Canonical source directory JSON](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/directory.json).
- [Live registry directory JSON](https://ui.shadcn.com/r/registries.json).

Both JSON sources returned **539 entries, with 539 distinct namespaces**. Namespace membership, homepage, registry URL template and description agreed across the two feeds. These counts concern registry publishers, not installed blocks, components, or licenses.

The companion [full inventory](shadcn-registry-inventory.json) preserves **every one of the 539 namespaces**, its homepage link, registry URL template and description. Every entry has keyword-derived subject tags, block/layout candidacy, pricing/license words, a framework compatibility signal, and a separate verification status. Logos and health/ranking telemetry were omitted. No component source or previews were mirrored.

**20 directory entries received first-party shortlist or commercial-status checks; 519 remain metadata-only.** The 20 comparison rows below group Cnippet UI and Cnippet Blocks together, and supplement the directory with official shadcn blocks and 21st.dev. Shadcnblocks is covered in a separate commercial-status section. Neither official blocks nor 21st.dev appeared as a named entry in this snapshot; Origin UI's current directory entry is `@coss`.

### All-directory metadata classification

Tags overlap; these are keyword matches against publisher descriptions and namespace names, not independently tested capabilities.

| Metadata tag | Entries |
| --- | ---: |
| Primitives, forms, components or accessibility | 393 |
| Motion, animations or effects | 162 |
| Blocks, layouts, sections, templates or marketing pages | 151 |
| Tools, hooks, icons, themes or infrastructure | 129 |
| AI/chat/agent interfaces | 84 |
| Charts, dashboards or data visualization | 49 |
| Search, filters, tables or sorting | 30 |
| Content, media, galleries or typography | 21 |
| Other framework / multiple-framework signal | 18 |
| Maps or geography | 12 |
| No listed subject keyword | 34 |

Pricing/license metadata screening found **97 free/open claims**, **7 mixed free-and-paid signals**, **5 paid/gated signals**, and **430 unspecified** entries. These counts do not measure how many registries are actually free. For example, a description without the word "free" may still describe an MIT library; conversely, an "open-source" claim may lead to a restricted LICENSE.

The inventory embeds the exact regex rules. A block candidate flag can also match an AI or dashboard block; it is not a claim that all 151 candidates suit a travel/creator site. Every metadata-only record says `licenseStatus: unverified`. Absence of a keyword never establishes absence of a feature.

## Actual YaHala compatibility

Read-only local evidence: [package.json](../../package.json), [components.json](../../components.json), and [UI consistency rules](../ui-consistency.md).

The manifests currently specify Astro **^7.4.4**, React **^19.3.1**, Tailwind **^4.3.3**, Base UI **^1.9.0**, Motion **^14.9.0**, and shadcn CLI **^4.23.0**. These are declared version ranges, not an installed-version or peer-dependency verification. The shadcn style is **base-rhea**, with `rsc: false`, CSS variables, stone base color, and Lucide icons. Configured registry aliases already include `@animate-ui`, `@cnippet`, and `@shadcn-map`.

This favors Base UI/Tailwind 4 variants. Radix-based examples can still be useful, but their wrappers and APIs are not interchangeable with the site's existing Base UI primitives. Reuse YaHala's Button, Badge, IconBadge and `ui-surface-card`; map imported layouts onto existing tokens rather than importing another visual system.

React components are a natural fit, but “supports React” does not establish drop-in Astro compatibility. Astro renders framework components as static HTML by default; interactive React needs an appropriate `client:*` directive. [Astro framework components](https://docs.astro.build/en/guides/framework-components/) and [client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives) explain the boundary.

Engineering implications, rather than measured benchmark results:

- Keep hero, biography, FAQ copy and editorial card grids static where possible. Hydrate the filtering, player, lightbox or map island that actually needs interaction.
- Choose `client:load` for controls needed immediately; `client:visible` can defer below-fold enhancements. `client:only="react"` skips server rendering and should be reserved for browser-only dependencies.
- Next.js `next/image`, `next/link`, routing hooks, Server Actions, app-directory files, authentication wrappers and server data integrations need adapting. Copy a presentation section, not its Next.js application shell.
- Motion is already declared, but a component importing `framer-motion`, GSAP, Three.js, WebGL or an additional player/chart package can still add dependencies and browser work. Prefer existing `motion/react` patterns and respect reduced motion.
- Filter state, keyboard focus, empty states and story URLs must remain YaHala's behavior. A commercial-looking filter/table demo is not a replacement for the existing story data flow.
- Avoid adding another map engine merely for a block. Leaflet, React Leaflet and MapLibre already appear in the manifest. Map tiles, attribution and provider terms are separate from component licenses.

## First-party comparison: 20 candidates

“Verified MIT” below means the linked repository LICENSE was read and contains the MIT grant without an additional restriction found in that file. It does not grant rights to separate Pro products, stock media, fonts, datasets or every dependency.

| Library / namespace | Free / licensing status and primary evidence | Useful YaHala building blocks and limitations |
| --- | --- | --- |
| **1. Official shadcn blocks** | **Verified MIT**: [LICENSE](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md). [Blocks site](https://ui.shadcn.com/blocks) explicitly offers free open-source blocks for React frameworks. | Baseline dashboard/sidebar, tables and accessible application framing. Good reference for `/stories` toolbar and responsive framing; current featured catalog emphasizes dashboard/auth rather than travel/editorial pages. |
| **2. Tailark — `@tailark`** | **Verified MIT OSS repository**: [LICENCE.md](https://github.com/tailark/blocks/blob/main/LICENCE.md), [README](https://github.com/tailark/blocks/blob/main/README.md). [Main site](https://tailark.com) is a broader marketing product; do not extend the OSS grant to all commercial offerings. | Strong landing/About section collection: hero, feature/content sections, social proof, CTA and footer compositions. README documents Base UI as default and a Radix alternative. It currently points OSS users to a separate `@tailark-oss` endpoint; that hostname failed to fetch during this survey, so verify item delivery before choosing it. |
| **3. Kibo UI — `@kibo-ui`** | **Verified MIT**: [license.md](https://github.com/shadcnblocks/kibo/blob/main/license.md). [Own site](https://www.kibo-ui.com/) identifies the library as free/open source. This grant is distinct from the same organization's Shadcnblocks product. | Particularly useful [Stories](https://www.kibo-ui.com/components/stories), [Reel](https://www.kibo-ui.com/components/reel), [Video Player](https://www.kibo-ui.com/components/video-player), [Image Zoom](https://www.kibo-ui.com/components/image-zoom), tags and comboboxes. Stories here means a media presentation component, not a complete filterable archive. Check player/autoplay behavior and extra dependencies. |
| **4. Shadcn Space — `@shadcn-space`** | **Verified MIT public repository**, **mixed commercial site**: [LICENSE](https://github.com/shadcnspace/shadcnspace/blob/main/LICENSE), [catalog](https://shadcnspace.com/blocks). Both Base UI and Radix variants are advertised. | Best direct match: catalog explicitly marks **Bio Link 01 — Founder Bio Link**, **Gallery 01 — Destination Gallery**, and **About Us 01 — Impact Metrics** free. These map to all three YaHala routes. Newer gallery/biolink/about variants include Pro entries; choose the marked free item and confirm it belongs to the licensed public source. |
| **5. Shadcn Studio — `@shadcn-studio`** | **Source available with restrictions; mixed Free/Pro**. [LICENSE.md](https://github.com/shadcnstudio/shadcn-studio/blob/main/LICENSE.md) includes MIT text plus Commons Clause restrictions on unmodified component redistribution and competing products. [FAQ](https://shadcnstudio.com/faqs) uses broader MIT/open-source marketing language; the actual extra clauses matter. | Broad page blocks, cards, navigation, themes and dashboards. Potential section references, but below plain-MIT options for this brief. Paid templates and advanced blocks are not automatically free because a preview exists. |
| **6. Kokonut UI — `@kokonutui`** | **Verified MIT free repository**, with separate Pro components/templates: [LICENSE](https://github.com/kokonut-labs/kokonutui/blob/main/LICENSE), [site](https://kokonutui.com). | Polished interactive cards, lists and navigation details for story discovery. The current site describes a paid catalog including heroes and complete portfolio templates; do not assume those layouts inherit the free repo license. Use small enhancements rather than an entire animation-heavy shell. |
| **7. Origin UI → coss UI — `@coss`** | **Verified MIT**: [LICENSE](https://github.com/cosscom/ui/blob/main/LICENSE), [README](https://github.com/cosscom/ui/blob/main/README.md). [originui.com](https://originui.com) now redirects to [coss UI](https://coss.com/ui); legacy Origin code is retained under `apps/origin`. | Very strong Base UI fit for comboboxes, autocomplete, fields, checkboxes, toggle groups, pagination and empty states. Best to refine `/stories` filters and controls; not primarily a complete landing-page block catalog. |
| **8. Cult UI — `@cult-ui`** | **Verified MIT component repository**: [LICENSE.md](https://github.com/nolly-studio/cult-ui/blob/main/LICENSE.md), [site](https://www.cult-ui.com). The same site separately promotes paid full-stack AI SDK agent blocks. | [Component catalog](https://www.cult-ui.com/docs/components) includes halo search, direction-aware tabs, sortable lists and floating panels. Possible discovery controls or creator-story accents; avoid unnecessary AI/agent packages and preserve the site's own search interactions. |
| **9. Aceternity UI — `@aceternity`** | **Free component tier + paid blocks/templates, custom license**. [Home](https://ui.aceternity.com/) distinguishes free components from All-Access blocks. [License](https://ui.aceternity.com/licence) permits end products and modification but restricts redistribution/marketplace derivatives. No authoritative MIT component repository was located; do not substitute a third-party MCP wrapper's MIT license. | Bento grids, cards, Apple-style carousel and image effects could showcase destinations. Complete hero/feature/footer blocks and landing templates are largely paid. Stronger visual spectacle than YaHala needs; prefer simpler MIT alternatives. |
| **10. Magic UI — `@magicui`** | **Verified MIT public components**, with separate Pro blocks/templates: [LICENSE.md](https://github.com/magicuidesign/magicui/blob/main/LICENSE.md), [site](https://magicui.design). | Bento-style layouts, marquee, video/dialog treatments, number animation and text accents can enhance a hero or About metrics. Best as a few accents; the Pro landing sections are not covered by merely finding the MIT public repo. |
| **11. React Bits — `@react-bits`** | **Source available, not plain MIT**: [LICENSE.md](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) says MIT + Commons Clause and restricts component redistribution; tools/sounds have additional terms. [Site](https://reactbits.dev) offers source in JS/TS and CSS/Tailwind variants, and promotes Pro. | Galleries, card interactions, text effects and backgrounds. Useful inspiration or a selective enhancement, but a weak first choice for a low-JS story archive. Review canvas/WebGL dependencies, touch support and reduced motion per item. |
| **12. Animate UI — `@animate-ui`** | **Source available with MIT + Commons Clause**: [LICENSE.md](https://github.com/imskyleen/animate-ui/blob/main/LICENSE.md). [Current site](https://animate-ui.com) emphasizes animated primitives for Base UI, Radix and React Aria. | Tabs, accordions, dialogs and number transitions; closest to motion primitives rather than premade editorial layouts. Already a configured registry in YaHala. Preserve the license applicable to any previously copied version; current upstream terms do not determine historical-copy terms. |
| **13. Eldora UI — `@eldoraui`** | **Verified MIT**: [LICENSE.md](https://github.com/karthikmudunuri/eldoraui/blob/main/LICENSE.md), [site](https://eldoraui.site). | Animated cards, text and presentation effects suitable for a restrained landing/About accent. Less compelling than a dedicated block library for assembling whole routes; inspect per-component dependencies before use. |
| **14. 21st.dev** | **Per-item review required**, with mixed platform access. [Platform repository LICENSE](https://github.com/serafimcloud/21st/blob/main/LICENSE) is MIT, but that is not a universal license for every author's submission. [Current site](https://21st.dev) describes free browsing and limited copy/install access with paid plans. | Good broad discovery source for hero, gallery, navbar and bento patterns. A [specific community example](https://21st.dev/@darshan-rajadhyaksha/components/backdrop) exposes its author, source and MIT license; verify that provenance for the actual chosen block. A live preview or platform MIT license alone is insufficient. Not present as a directory namespace in this snapshot. |
| **15. Blocks.so — `@blocks-so`** | **Verified MIT**: [LICENSE.md](https://github.com/ephraimduncan/blocks/blob/main/LICENSE.md), [site](https://blocks.so). | Grid lists, command menus, dialogs, stats and tables. Good application patterns for story cards, filter panels and About metrics; less emphasis on full editorial/marketing page compositions. |
| **16. UI Layouts — `@ui-layouts`** | **Verified MIT free repository**, with separate Pro blocks: [LICENSE](https://github.com/ui-layouts/uilayouts/blob/main/LICENSE), [site](https://ui-layouts.com). | [Gallery modal](https://ui-layouts.com/components/gallery-modal), responsive modal, timeline, image reveal, horizontal scroll and stacking cards. Useful for `/about` chronology or a destination gallery; Pro ready-made blocks are a distinct offering and many effects add substantial motion. |
| **17. Cnippet UI / Blocks — `@cnippet`, `@cnippet-blocks`** | **Verified MIT core UI repository**: [LICENSE](https://github.com/cnippet-dev/ui-cnippet/blob/main/LICENSE), [UI site](https://ui.cnippet.dev). [Blocks site](https://blocks.cnippet.dev) explicitly claims MIT/free, but a separate Blocks LICENSE was not located; core UI's grant is not proof for every separate template. | Base UI foundation is an excellent local match; current block site exposes [hero](https://blocks.cnippet.dev/sections/hero), [blog](https://blocks.cnippet.dev/sections/blog), [FAQ](https://blocks.cnippet.dev/sections/faq) and [gallery](https://blocks.cnippet.dev/sections/gallery) categories. Directory says 110+ sections, while its home says 23 sections/5 templates: treat counts as inconsistent publisher metadata. Core alias already configured. |
| **18. Saastro — `@saastro`** | **License unverified**. [Own site](https://ui.saastro.io) and [docs](https://ui.saastro.io/docs) were checked, but no authoritative LICENSE/repository was located. Strong compatibility signal is not a grant of use. | Astro-native candidate: [Hero 01](https://ui.saastro.io/blocks/hero-01), hero with image, feature grids, numbered steps, blog grid, footer and no-JS FAQ. Site advertises static `.astro` blocks alongside React/Base UI blocks. Worth a follow-up after license provenance is established. |
| **19. mapcn — `@mapcn`** | **Verified MIT code**: [LICENSE](https://github.com/AnmolSaini16/mapcn/blob/main/LICENSE), [site](https://mapcn.dev). Tile/provider/data terms remain separate. | Direct React/MapLibre map presentation candidate for destination markers and story selection. YaHala already has mapping dependencies; prefer existing map behavior unless a specific missing feature justifies adapting this library. Not a landing/About layout kit. |
| **20. OpenStatus data-table-filters — `@data-table-filters`** | **Verified MIT**: [LICENSE](https://github.com/openstatusHQ/data-table-filters/blob/main/LICENSE), [site](https://data-table.openstatus.dev). | Strong reference for faceted filters, sorting, infinite scroll and filter counts. Its playbook includes TanStack Table, nuqs/Zustand and optional Drizzle SQL; these are not automatically present in YaHala. Borrow interaction ideas before adopting a table/data stack for a card-based Story Browser. |

### Especially relevant free blocks, checked on their own catalog pages

- [Shadcn Space biolink category](https://shadcnspace.com/blocks/marketing/biolink): **Bio Link 01 — Founder Bio Link** is labeled Free; later portfolio and fitness variants include Pro. Closest ready-made fit for YaHala's creator link hub.
- [Shadcn Space gallery category](https://shadcnspace.com/blocks/marketing/gallery): **Gallery 01 — Destination Gallery** is labeled Free and explicitly describes travel/destination presentation. Strong starting point for visual story cards, while retaining YaHala's filtering.
- [Shadcn Space About category](https://shadcnspace.com/blocks/marketing/about-us-section): **About Us 01 — Impact Metrics** is labeled Free. Could support biography/value pillars and counters; later manifesto variants include Pro.

These labels establish current free catalog status. Match the chosen item's source to the MIT public repository before importing; category-level license evidence is not an audit of each downloadable payload.

## Shadcnblocks free set: separate commercial status check

[Shadcnblocks](https://shadcnblocks.com) is listed as `@shadcnblocks` and was checked as an additional commercial-status source beyond the 20-row shortlist. The inventory records this supplemental first-party check separately from metadata screening.

Its own [Terms](https://www.shadcnblocks.com/terms) explicitly distinguish **Free Blocks** from paid content. Free blocks may be installed and modified inside an end-product website, including an end-product public repository. Republishing the blocks as a library, kit, template or catalog is restricted. The terms also distinguish existing end-product copies from directory/display permissions that can be withdrawn. Therefore: **free-to-use subset under custom terms, not blanket OSI/MIT**.

Use its [block catalog](https://www.shadcnblocks.com/blocks) with the Free filter for hero, feature, CTA, footer, about and gallery ideas, then check the individual item and current terms. No bulk block download or source mirroring was performed. Kibo's MIT status does not license this catalog. For this task, Shadcn Space and Tailark OSS are cleaner first choices.

## Ranked plan for YaHala

| Rank | Recommendation | Where it helps | Why / adoption boundary |
| --- | --- | --- | --- |
| 1 | **Shadcn Space free Bio Link 01 + Destination Gallery 01 + About Us 01** | All three routes | Closest premade content match, public MIT code and Base UI variants. Keep only useful layout composition; retain YaHala's shared styling and story data. |
| 2 | **Tailark OSS marketing sections** | `/`, `/about` | Coherent, reusable page sections, MIT and Base UI default. Resolve the separate OSS endpoint availability before relying on its CLI distribution. |
| 3 | **Kibo UI media pieces** | `/`, `/stories` | Concrete stories/reel/video/image-zoom options with verified MIT source. Add only when they improve the current viewing flow. |
| 4 | **coss UI + existing shadcn primitives** | `/stories` | Best Base UI match for search, filter controls and states. Keep it inside the existing island rather than replacing the whole browser. |
| 5 | **Official shadcn blocks / Blocks.so** | Responsive framing, lists, panels, metrics | Conservative open-source examples with fewer catalog-license ambiguities. Dashboard orientation means some editorial adaptation. |
| 6 | **Cnippet core; Blocks after license-file confirmation** | Landing, FAQ, gallery | Core is MIT/Base UI and already configured. Separate Blocks licensing/count inconsistencies need resolving first. |
| 7 | **Magic UI / Cult UI / Kokonut UI / Eldora UI** | A single visual accent | Verified free MIT component sources; use sparingly and avoid treating separate paid block products as free. |
| 8 | **Saastro, pending license provenance** | Static landing/About sections | Strongest Astro-native shape, but not a verified free/open-source recommendation yet. |

For a first implementation, take one coherent page-section family plus existing primitives. Combining many registry visual systems will cost more integration work than the premade blocks save.

### Additional directory leads, not individually license-verified

These came from the complete metadata screening and should not be silently lost just because larger libraries dominate the shortlist:

- [`@7ovr`](https://7ovr.com): Base UI blocks/page templates and presets.
- [`@balick`](https://ui.balick.me): composable page blocks.
- [`@ecomcn`](https://ecomcn.vercel.app): card grids, URL filters, sort/load-more and empty-state patterns potentially reusable for stories.
- [`@tablecn`](https://table-cn.vercel.app): URL-synced filter/table patterns with Base UI variants; its own homepage was spot-checked, but its license was not checked.
- [`@visited-map`](https://visitedmap.vercel.app): SVG visited-country map with city pins and statistics; metadata suggests unusually close travel relevance.
- [`@flightcn`](https://flightcn.yencheng.dev): mapcn flight routes.
- [`@quill`](https://www.quilldesignsystem.com): editorial design system with page blocks.
- [`@weinc`](https://we.inc/components), [`@velora`](https://velora.colorlib.com), [`@watermelon`](https://ui.watermelon.sh): descriptions claim free/open-source sections or blocks. Those claims were not license-verified.

All remaining directory entries, including niche widgets, framework-specific kits and paid catalogs, remain available with their original links in the JSON inventory.

## Namespaced CLI use: how it works, without installing anything

Official sources: [registry namespace docs](https://ui.shadcn.com/docs/registry/namespace), [getting started](https://ui.shadcn.com/docs/registry/getting-started), [CLI reference](https://ui.shadcn.com/docs/cli). Documentation was queried through Context7 against `/shadcn-ui/ui`.

A registry namespace maps to a URL template in `components.json`:

```json
{
  "registries": {
    "@publisher": "https://publisher.example/r/{name}.json"
  }
}
```

Then `npx shadcn@latest add @publisher/item-name` resolves `{name}`, reads the registry item, and copies the declared source/dependencies into the project. Some registries use `{style}` too, or require authenticated access. A namespace is an address, not a license, framework-compatibility promise, or guarantee that an item is free.

Useful documented commands for a future implementation, **not executed in this research**:

```sh
npx shadcn@latest registry add @publisher=https://publisher.example/r/{name}.json
npx shadcn@latest add @publisher/item-name --dry-run
npx shadcn@latest add @publisher/item-name --diff
npx shadcn@latest add @publisher/item-name --view
```

These URLs/names are placeholders. Use the publisher's actual endpoint and catalog item name. For Tailark in particular, the directory's `@tailark` endpoint differs from the OSS README's `@tailark-oss` example. For registries with style segments, confirm that a Base UI version is actually available instead of assuming YaHala's `base-rhea` works everywhere.

Review the prospective file/dependency changes and preserve local primitive customizations. Avoid blanket overwrite flags. No CLI registry was added, component installed, dependency changed, preview server started or UI code edited during this survey.

## License summary and limits

**Fourteen candidates have plain MIT repository evidence in the comparison:** official shadcn, Tailark OSS, Kibo, Shadcn Space public source, Kokonut free source, coss/Origin, Cult free source, Magic UI free source, Eldora, Blocks.so, UI Layouts free source, Cnippet core, mapcn, and OpenStatus data-table-filters. The linked 21st platform repository is also MIT, but submitted components require their own provenance check and are not counted in that blanket component recommendation.

**Restricted/source-available:** Animate UI, React Bits and Shadcn Studio. **Custom free/paid terms:** Aceternity and Shadcnblocks. **Publisher MIT claim without separately located Blocks license:** Cnippet Blocks. **License unresolved:** Saastro and the metadata-only remainder.

[OSI's MIT license](https://opensource.org/license/mit) establishes the standard permission and notice requirement. [Commons Clause's own FAQ](https://commonsclause.com/) explains that adding its restriction means the result is not open source in the OSI sense. Read the actual project's text: the three restricted libraries above use different formulations.

This report records evidence as retrieved on the research date, not an immutable release snapshot. Mutable `main` links, catalog free/pro labels and endpoints can change. Keep the license notice and source revision of any code actually adopted. No exhaustive asset/dependency license audit, install/build, runtime, accessibility or performance test was run. Compatibility recommendations are reasoned from the local manifests and publisher docs, not proof that any candidate currently compiles in YaHala.

