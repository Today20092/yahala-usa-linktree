---
status: open
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

- [ ] Compare the checked-in sitemap with the output produced for all canonical,
      indexable Astro routes by the compatible `@astrojs/sitemap` version.
- [ ] Confirm how static assets, excluded routes, trailing slashes, and the
      production `site` URL affect the generated sitemap.
- [ ] Adopt the integration only if it covers the required URLs and lets the
      handwritten sitemap be deleted; otherwise keep the existing file and record
      the concrete reason in this ticket.
- [ ] Keep `robots.txt`, `llms.txt`, and the HTML sitemap link pointed at the final
      production location.
- [ ] Add no parallel sitemap source of truth.
- [ ] Verify the built `dist/sitemap.xml`, production build, and preview smoke
      behavior.

## Dependencies

None.
