# Astro feature selection guide

> Project policy: default to static Astro components fed by `src/data/site.yaml`. Add
> hydration, collections, or request-time features only when a concrete interaction,
> content-scale, or per-request requirement appears.

This guide covers Astro's major stable feature families. It is a decision guide, not
an inventory of every configuration option.

## Current project baseline

Ya Hala currently uses:

- static Astro pages for `/`, `/about`, and `/stories`;
- a shared Astro document layout and reusable Astro components;
- React islands for interactive search, maps, drawers, and animated values;
- `astro:assets` for local image optimization;
- Tailwind, shadcn components, and shared color tokens;
- `src/data/site.yaml` as the main editorial data source; and
- a custom Cloudflare Worker that serves the static build and API routes.

These are sound defaults. Do not replace working patterns merely to exercise more of
Astro's API.

## Quick decision table

| Need                                   | Use                                                             | Use it when                                                                  | Do not use it when                                      | Ya Hala status                              |
| -------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Repeated static UI                     | `.astro` component with typed props and, when useful, slots     | Markup or behavior has a meaningful repeated contract                        | Two fragments only look vaguely similar                 | **Use now**                                 |
| Shared page shell                      | Astro layout                                                    | Pages share document, metadata, header, or structural markup                 | The shared code is only a small UI fragment             | **Use now**                                 |
| Deploy-time content                    | Static prerendering                                             | Content is known at build time                                               | Output depends on the current request                   | **Use now; default**                        |
| Small browser behavior                 | Astro `<script>` or native HTML/CSS                             | No persistent component state is needed                                      | A framework island already owns that interaction        | **Use when simplest**                       |
| Stateful interactive widget            | Framework component plus the least eager `client:*` directive   | State, effects, or an existing React component justify shipped JavaScript    | Static markup or an Astro script is enough              | **Already used; review hydration timing**   |
| Optimized local image                  | `<Image />`, `<Picture />`, or `getImage()` from `astro:assets` | Astro can know the image at build time                                       | The asset must remain untouched or is a simple SVG icon | **Use now**                                 |
| One coherent site configuration        | Direct YAML import                                              | Data remains a small singleton edited together                               | There are many independently queried entries            | **Use now**                                 |
| Many related content entries           | Content collection with a schema                                | Entries need validation, querying, loaders, or independent authoring         | There is only one small configuration object            | **Use on trigger**                          |
| Pages generated from records           | Dynamic route plus `getStaticPaths()`                           | Each record needs its own build-time URL                                     | Filtering inside one page is sufficient                 | **Use on trigger**                          |
| Long-form prose                        | Markdown; MDX only if prose embeds components                   | Adding articles, policies, FAQs, or similar authored documents               | The content is structured application data              | **Use on trigger**                          |
| Public HTTP resource                   | Endpoint                                                        | Exposing JSON, RSS, an image, or a webhook                                   | Only the site's own form/UI calls it                    | **Custom Worker currently handles this**    |
| Site-owned form or mutation            | Astro Action                                                    | Adding contact, RSVP, subscription, or another validated mutation            | The endpoint is a public external API contract          | **Use on trigger**                          |
| Request-specific page                  | Per-route on-demand rendering                                   | Cookies, authentication, personalization, or request-fresh data changes HTML | Data can be refreshed at deployment                     | **Skip now**                                |
| Cross-route request policy             | Middleware and `Astro.locals`                                   | Auth, headers, redirects, or context must apply across routes                | One handler can own the behavior                        | **Skip now**                                |
| Request state across visits            | Sessions                                                        | An on-demand application flow needs server-side state                        | The site remains static or client storage is sufficient | **Skip now**                                |
| Personalized fragment in a static page | Server island                                                   | One small fragment needs request-time rendering without delaying the shell   | The whole page is static or must be dynamic together    | **Skip now**                                |
| Faster internal navigation             | Prefetch                                                        | Measurements or UX show benefit on internal page links                       | Links lead mainly to external sites                     | **Optional now**                            |
| Animated internal navigation           | View transitions                                                | A deliberate multi-page transition improves orientation                      | It is decoration without a UX goal                      | **Optional, not required**                  |
| Locale-specific URLs                   | Astro i18n routing                                              | Translations require distinct routes, fallback, and locale rules             | A page merely contains more than one language           | **Use on trigger**                          |
| Deployment configuration or secrets    | Environment variables / `astro:env`                             | A value varies by environment or must stay secret                            | It is public editorial content suited to YAML           | **Use on trigger**                          |
| Search-engine route discovery          | `@astrojs/sitemap`                                              | All public routes should be generated automatically                          | A custom sitemap already fully meets the need           | **Evaluate against current custom sitemap** |
| Recurring published feed               | `@astrojs/rss`                                                  | The site publishes episodic/article entries people can subscribe to          | There is no feed-like content set                       | **Use on trigger**                          |

## Feature families and project rules

### 1. Rendering architecture

Astro prerenders the site by default. Astro recommends starting with static output
and opting individual routes into on-demand rendering until most pages truly need
request-time output. Keep all current editorial pages static.
([On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/))

Client islands selectively hydrate framework components while the surrounding page
remains static HTML. A framework component without a `client:*` directive renders
as HTML without client-side JavaScript.
([Islands](https://docs.astro.build/en/concepts/islands/),
[framework components](https://docs.astro.build/en/guides/framework-components/))

Choose the least eager directive that still works:

- `client:visible` for below-the-fold widgets;
- `client:idle` for noncritical behavior needed soon after load;
- `client:media` for behavior that only exists at a matching breakpoint;
- `client:load` only when the widget must work immediately; and
- `client:only` only when the component cannot render on the server, because it
  deliberately skips server rendering.

Astro also supports `client:visible` root margins for loading shortly before a
widget reaches the viewport.
([Client directives](https://docs.astro.build/en/reference/directives-reference/#client-directives))

For this project, maps may justify `client:load` or `client:only` when their browser
libraries cannot render server-side. Below-the-fold counters and explorers should
prefer `client:visible`. Do not convert static cards into React components.

Server islands use `server:defer` to render a request-time fragment independently
from a mostly static page. Adopt them only if a future personalized fragment would
otherwise force an entire page into on-demand rendering.
([Server islands](https://docs.astro.build/en/guides/server-islands/))

### 2. Components, layouts, and templates

Astro components support props and named/default slots and ship no client runtime
by default. Use them for repeated static UI and for composing framework islands.
([Astro components](https://docs.astro.build/en/basics/astro-components/))

Layouts are ordinary components used as reusable page templates. Keep
`BrandedPageDocument.astro` responsible for the shared document shell; use ordinary
components for page sections.
([Layouts](https://docs.astro.build/en/basics/layouts/))

Template directives include `class:list`, `set:text`, `set:html`, client directives,
and script/style directives. Prefer normal expressions and escaped text.
`set:html` does not escape its input, so never give it untrusted content.
([Template directives](https://docs.astro.build/en/reference/directives-reference/))

### 3. Content and data

Keep `site.yaml` while the site's content is one structurally coherent configuration.
Astro/Vite supports importing YAML as data.
([Imports](https://docs.astro.build/en/guides/imports/))

Move a category—not the whole configuration—to a content collection when it becomes
a set of related entries that benefit from independent files, loader-based data,
queries, or schema validation. Good future candidates are episodes, stories,
sponsors, events, or team members. Collections support loaders and optional schemas
for validation and type inference.
([Content collections](https://docs.astro.build/en/guides/content-collections/))

Use Markdown for long prose. Add the official MDX integration only when prose must
embed UI components.
([Markdown](https://docs.astro.build/en/guides/markdown-content/),
[MDX integration](https://docs.astro.build/en/guides/integrations-guide/mdx/))

Top-level `fetch()` in Astro frontmatter runs while a page is generated—at build
time for a prerendered page and at request time for an on-demand page. Prefer the
current checked-in data workflow when reproducible builds and editorial control
matter.
([Data fetching](https://docs.astro.build/en/guides/data-fetching/))

Use environment variables only for environment-specific configuration and secrets.
Browser-exposed values are public; keep private values out of client code.
([Environment variables](https://docs.astro.build/en/guides/environment-variables/))

### 4. Routing and server features

Astro uses file-based routing. Use `[slug].astro` and `getStaticPaths()` when a
content set needs one prerendered page per record. Redirects and rewrites belong in
Astro routing configuration when Astro, rather than the custom Worker, owns them.
([Routing](https://docs.astro.build/en/guides/routing/))

Endpoints serve arbitrary HTTP responses and methods. Keep the current Worker API
while it remains the deployment boundary; do not duplicate those handlers in Astro.
If the project later adopts an Astro server adapter, reconsider whether Astro
endpoints can remove custom Worker code.
([Endpoints](https://docs.astro.build/en/guides/endpoints/))

Actions are the default choice for future site-owned forms and mutations because
they provide typed server calls, form/JSON handling, input validation, and
standardized errors. They are not a replacement for a public API contract.
([Actions](https://docs.astro.build/en/guides/actions/))

Middleware can intercept page and endpoint rendering and populate `Astro.locals`.
Add it only when several routes share a request concern.
([Middleware](https://docs.astro.build/en/guides/middleware/))

Sessions store server-side state for on-demand routes and need an appropriate
storage driver. They provide no value to the current static pages.
([Sessions](https://docs.astro.build/en/guides/sessions/))

Astro i18n configuration supports locales, URL prefixes, fallbacks, redirects, and
rewrites. Adopt it when Ya Hala commits to locale-specific URLs—not merely because
some content is bilingual.
([Internationalization](https://docs.astro.build/en/guides/internationalization/))

### 5. Assets, styles, scripts, and navigation

Use `astro:assets` for local raster content images. `<Image />` and `<Picture />`
provide Astro's image processing; images placed in `public/` and ordinary remote
`<img>` elements are not automatically transformed in the same way.
([Images](https://docs.astro.build/en/guides/images/))

Keep Tailwind and the existing design tokens as the shared styling system. Use
Astro's scoped component styles for truly local exceptions; Astro scopes component
styles by default and also supports global CSS and CSS integrations.
([Styling](https://docs.astro.build/en/guides/styling/))

Astro processes ordinary component `<script>` tags as TypeScript/module scripts,
bundles them, deduplicates repeated component scripts, and can inline small scripts.
Use `is:inline` only when exact untouched output is required because it disables
this processing.
([Client scripts](https://docs.astro.build/en/guides/client-side-scripts/),
[`is:inline`](https://docs.astro.build/en/reference/directives-reference/#isinline))

Prefetch is opt-in and provides strategies such as tap, hover, viewport, and page
load. Enable it only for internal routes where it improves measured or perceived
navigation; it does nothing for outbound social and sponsor links.
([Prefetch](https://docs.astro.build/en/guides/prefetch/))

Astro supports native View Transition APIs with additional routing behavior. Treat
this as optional navigation polish, not a default requirement.
([View transitions](https://docs.astro.build/en/guides/view-transitions/))

Self-host fonts through local assets and CSS when practical, as the project already
does through Fontsource.
([Fonts](https://docs.astro.build/en/guides/fonts/))

### 6. Integrations, Cloudflare, and tooling

Integrations add framework renderers, adapters, or build behavior. Keep React and
`astro-icon` because the project uses them. Add no integration without a current
requirement.
([Integrations](https://docs.astro.build/en/guides/integrations-guide/))

The official Cloudflare adapter provides Cloudflare runtime rendering and binding
access. This project currently deploys a custom Worker over static `dist` assets,
so installing the adapter is unnecessary unless Astro begins owning on-demand
routes, Actions, middleware, or server islands.
([Cloudflare integration](https://docs.astro.build/en/guides/integrations-guide/cloudflare/))

Astro supports TypeScript, but `astro build` does not perform full type checking.
Use editor diagnostics and add `astro check` to validation when type errors need a
repeatable CI gate.
([TypeScript](https://docs.astro.build/en/guides/typescript/))

The official sitemap integration generates a sitemap from project routes. Compare
it with the existing custom sitemap before adding it; keep whichever leaves less
code while covering all canonical public routes.
([Sitemap integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/))

Add RSS only if stories or episodes become a recurring subscribable publication.
([RSS recipe](https://docs.astro.build/en/recipes/rss/))

Use a small automated test for nontrivial behavior. Astro documents unit/component
testing with tools such as Vitest and browser-level testing, but does not require a
specific runner.
([Testing](https://docs.astro.build/en/guides/testing/))

## Trigger checklist

When a new requirement arrives, ask these questions in order:

1. Can static HTML, native HTML behavior, or CSS solve it?
2. Is there already an Astro component, script, React island, or Worker handler to
   reuse?
3. Is the data known at deployment? If yes, keep the route prerendered.
4. Does interaction require persistent client state? If yes, use the smallest island
   and least eager hydration directive.
5. Is this one configuration object or a collection of independently managed
   entries? Use YAML for the first and a content collection for the second.
6. Is the server operation internal to this site's UI? Prefer an Action. Is it a
   public HTTP contract? Prefer an endpoint.
7. Does a concern cross several request handlers? Only then add middleware.
8. Would an Astro runtime feature eliminate enough custom Worker code to justify the
   Cloudflare adapter? If not, keep the static build plus Worker.
9. Is an experimental feature the only practical solution? If not, use the stable
   feature.

## Features intentionally not adopted by default

- Global `output: "server"`: Astro says this mainly flips the rendering default;
  per-route on-demand rendering is the better fit until most pages need it.
- Content collections for the singleton `site.yaml`: no present payoff.
- Framework components for static cards and sections: they add complexity without
  useful interactivity.
- `client:only` as a routine hydration strategy: it gives up server-rendered HTML.
- Middleware, sessions, server islands, and Actions without a server-side workflow.
- MDX when plain Markdown is sufficient.
- Experimental flags in the team's normal feature policy; experimental APIs can
  change and should answer a specific unmet need.

## Official source index

- [Why Astro](https://docs.astro.build/en/concepts/why-astro/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Layouts](https://docs.astro.build/en/basics/layouts/)
- [Routing](https://docs.astro.build/en/guides/routing/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Configuration reference](https://docs.astro.build/en/reference/configuration-reference/)
- [Upgrade to Astro 7](https://docs.astro.build/en/guides/upgrade-to/v7/)
