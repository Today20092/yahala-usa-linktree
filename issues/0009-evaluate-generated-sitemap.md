---
status: closed
triage: ready-for-agent
branch: seo/evaluate-astro-sitemap
---

# 09 — Compare the static sitemap with `@astrojs/sitemap`

## Context

The repository maintains `public/sitemap.xml` by hand while Astro already knows
the public file-based routes. The official sitemap integration can generate routes
from the configured `site`, but adopting it is only worthwhile if it covers the
current canonical URLs and removes manual maintenance without complicating the
custom Cloudflare Worker deployment.

## Branch strategy

Implement the comparison and any justified migration on
`seo/evaluate-astro-sitemap`. Sitemap ownership is independent of hydration and
type-checking, so it should be reviewed and reverted independently.

## Acceptance criteria

- [x] Compare the checked-in sitemap with the output produced for all canonical,
      indexable Astro routes by the compatible `@astrojs/sitemap` version.
- [x] Confirm how static assets, excluded routes, trailing slashes, and the
      production `site` URL affect the generated sitemap.
- [x] Adopt the integration only if it covers the required URLs and lets the
      handwritten sitemap be deleted; otherwise keep the existing file and record
      the concrete reason in this ticket.
- [x] Keep `robots.txt`, `llms.txt`, and the HTML sitemap link pointed at the final
      production location.
- [x] Add no parallel sitemap source of truth.
- [x] Verify the built `dist/sitemap.xml`, production build, and preview smoke
      behavior.

## Dependencies

None.

## Evaluation

`@astrojs/sitemap` 3.7.3 is compatible with the installed Astro 7 release and
discovers the three canonical, indexable routes:

- `https://yahalausa.net/`
- `https://yahalausa.net/about/`
- `https://yahalausa.net/stories/`

The integration derives the origin from Astro's production `site` setting, adds
trailing slashes to the page URLs, and excludes static assets and non-page files.
There are no excluded page routes in the current site.

The integration was not adopted because it emits `sitemap-index.xml` and
`sitemap-0.xml`, even for these three URLs, and has no supported single-file
output option. Adopting it would remove the required `/sitemap.xml` artifact or
require another sitemap source or post-build rewrite. The checked-in
`public/sitemap.xml` remains the single source and now includes all three routes.

The comparison was:

- Before: the checked-in sitemap contained only `https://yahalausa.net/`.
- Generated: the integration found `/`, `/about/`, and `/stories/`.
- Final: the checked-in sitemap contains those same three URLs at
  `https://yahalausa.net/sitemap.xml`.

## Verification

- `npm run build` passed and produced only `dist/sitemap.xml`.
- The built sitemap contains `/`, `/about/`, and `/stories/`.
- `public/robots.txt`, `public/llms.txt`, and the HTML sitemap link all still
  target `https://yahalausa.net/sitemap.xml`.
- `npm run smoke:preview -- dist` passed.
- Every repository `test:*` script passed.
