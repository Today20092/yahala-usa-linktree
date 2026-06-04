# AGENTS.md

## Project Overview

This repository is a single-page Astro landing page / linktree for `Ya Hala with Haithum`.

- Primary URL: `https://today20092.github.io/yahala-usa-linktree/`
- Brand name: `Ya Hala with Haithum ياهلا مع هيثم`
- Primary language: English
- Core topics: Arab American stories, field interviews, community highlights, culture, work, and impact across America
- Site role: a public profile hub that pushes visitors to social channels, latest videos, and share/QR entry points

## What The Site Contains

The home page is intentionally one route and acts as the entire site:

- Hero/profile section with branded cover art
- Social link buttons for YouTube, TikTok, Instagram, and Facebook
- QR/share button for mobile handoff
- Latest YouTube video cards
- Video bento grid with clips and social reach highlights
- Reach badge showing total audience across platforms

## Source Of Truth Files

- `src/pages/index.astro` owns the page composition, metadata, structured data, and social link list
- `src/components/Link.astro` owns the reusable button/link styling
- `src/components/QrCodeButton.astro` owns the QR/share dialog
- `src/components/LatestChannelVideo.astro` owns the latest-video cards
- `src/components/VideoBentoGrid.astro` owns the video/social bento section
- `src/components/ReachBadge.astro` owns the audience summary card
- `src/data/youtube-channels.json` defines tracked YouTube channels
- `src/data/latest-youtube-videos.json` stores generated latest-video snapshots
- `src/data/social-reach.json` stores follower/view counts used in the reach badge
- `src/assets/yahala-hero-cover.png` and `public/og-image.png` are the main brand images
- `public/robots.txt`, `public/site.webmanifest`, and favicon assets support the public site
- `scripts/update-latest-youtube-video.mjs` refreshes the generated YouTube data

## Update Rules

- Keep the page as a simple one-page link hub unless the user explicitly asks for multi-page expansion
- If you add, remove, or rename social links in `src/pages/index.astro`, keep metadata in sync:
  - `sameAs` / `significantLink`
  - Open Graph and Twitter metadata
  - Any visible buttons or labels
- Treat `src/data/latest-youtube-videos.json` as generated output; refresh it with `npm run update:youtube` instead of editing it by hand unless you are intentionally patching fallback data
- Update `src/data/social-reach.json` whenever the displayed platform metrics change
- Preserve the Arabic/English brand text and the site’s community-focused tone
- Keep the page mobile-first and fast; this is a link hub, not a content-heavy marketing site

## Development Commands

- Install dependencies: `npm install`
- Start local dev server: `npm run dev`
- Refresh latest YouTube data: `npm run update:youtube`
- Build production output: `npm run build`
- Preview production output: `npm run preview`

## Implementation Notes

- The app uses Astro with Tailwind and `astro-icon`
- Prefer TypeScript/modern Astro patterns when adding code
- Maintain accessible labels, button states, and keyboard support for interactive elements
- Preserve the existing visual style: branded hero, rounded cards, soft gradients, and prominent CTA buttons

