# Ya Hala with Haithum

[![Astro](https://img.shields.io/badge/Astro-7.0.0-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-ready-111827?style=for-the-badge)](https://ui.shadcn.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-deployed-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey?style=for-the-badge)](#)

> Ya Hala shares Arab American stories, featured videos, and official social links through a landing page, an About Page, and a filterable Story Browser.

The semantic YouTube transcript search uses Workers AI, Vectorize, R2, Queues,
and owner-authorized YouTube captions. See
[`docs/video-search-setup.md`](docs/video-search-setup.md) for provisioning,
OAuth, deployment, and backfill instructions.

## Project guides

- [Project setup and review](docs/project-foundation-review.md)
- [Agent instructions and preview deployment](AGENTS.md)
- [Specifications and issue tracking](docs/agents/issue-tracker.md)
- [Domain language](CONTEXT.md)
- [Versioning and releases](docs/releasing.md)
- [Git integration and promotion](docs/branch-workflow.md)
- [Preview smoke checks](docs/preview-smoke.md)

## Overview

Ya Hala with Haithum is a modern linktree-style landing page built for the web presence behind the channel. It is designed to be fast, mobile-friendly, and easy to maintain, with all core content driven from `src/data/site.yaml`.

The project is hosted on Cloudflare Pages/Workers and uses Astro, Tailwind CSS, and shadcn components with shared color tokens for a consistent visual system.

## Features

- Landing page, About Page, and filterable Story Browser
- Branded social link hub for YouTube, TikTok, Instagram, and Facebook
- Featured episodes and community-focused content blocks
- Data-driven site content from `src/data/site.yaml`
- Astro 7 with Tailwind and shadcn-based UI patterns
- Cloudflare-ready deployment workflow

## Tech Stack

- [Astro 7](https://astro.build/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- React integration for interactive pieces
- Cloudflare Pages / Workers hosting

## Local Development

All commands run from the project root.

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Astro dev server |
| `npm run check` | Check Astro templates and types |
| `npm run build` | Build the production site |
| `npm run preview` | Preview the production build locally |
| `npm run astro ...` | Run Astro CLI commands |

The site content is configured in `src/data/site.yaml`, so updates to links, labels, featured videos, and visited places should usually start there.

## Deployment

The [Git workflow](docs/branch-workflow.md) uses `development` for integration and `main` for reviewed releases. The migrated [Deploy workflow](.github/workflows/deploy.yml) deploys pushes to `main` and manual runs on `main`. Catalog refreshes update `development` and reach production through promotion. Remote cutover is pending; GitHub still uses the legacy `master` workflows until the migration is published. Follow [AGENTS.md](AGENTS.md) for the pinned development target and production authorization boundary, and [the release policy](docs/releasing.md) for release preparation.

Before deploying, it is a good idea to:

1. Run `npm run build`
2. Check the generated output for any warnings
3. Confirm the README or site copy still matches the current data in `src/data/site.yaml`

## Project Structure

```text
/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   │   └── site.yaml
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── package.json
└── README.md
```

## Notes

- This is a polished landing page, not a full application.
- The README is intentionally concise so visitors can quickly understand what the repository does.
- The visual content and site identity should stay aligned with Ya Hala branding across the repository and the live site.
