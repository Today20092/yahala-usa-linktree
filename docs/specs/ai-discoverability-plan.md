# Ya Hala AI Discoverability Plan

## Goal

Make Ya Hala with Haithum and its official channels more likely to be cited or recommended by AI answer engines such as ChatGPT, Claude, Perplexity, Gemini, and Google AI results.

## Current conclusion

Profound is primarily a measurement, diagnosis, content-production, and remeasurement platform. It cannot guarantee recommendation placement.

Ya Hala already has useful technical foundations:

- Canonical metadata and social previews
- Organization structured data and official social links
- `robots.txt`, `sitemap.xml`, and `llms.txt`
- YouTube metadata and transcripts
- Semantic transcript search
- Visited-place data

The main opportunity is publishing authoritative, crawlable, independently corroborated content that answers specific audience questions.

## Proposed direction

1. Give substantial videos permanent bilingual story pages containing summaries, edited transcripts, named entities, locations, dates, embeds, sources, and appropriate structured data.
2. Build city and topic hubs from the existing video, transcript, and visited-place data.
3. Define 25–40 high-intent questions for which Ya Hala should become a useful source.
4. Keep brand identity and official profile links consistent across the site and social platforms.
5. Earn legitimate links and corroboration from featured businesses, nonprofits, mosques, festivals, and local publications.
6. Verify indexing through Google Search Console, Bing Webmaster Tools, and relevant crawler rules.
7. Measure the chosen prompts monthly across major answer engines before considering a paid monitoring platform.

## Relevant artifacts

- Primary-source research: `docs/research/ai-answer-discoverability.md`
- Main content configuration: `src/data/site.yaml`
- Homepage SEO and structured data: `src/pages/index.astro`
- Existing story route: `src/pages/stories.astro`
- AI crawler summary: `public/llms.txt`
- Sitemap: `public/sitemap.xml`

## Decisions still needed

- Which recommendation questions and geographic markets matter first?
- Should the initial release cover selected high-value videos or the full archive?
- How much Arabic content should be fully translated versus summarized?
- What editorial review process will protect accuracy for people, businesses, and locations?
- Should generated story pages be static at build time or created through a content collection?
- Who will handle outreach to featured organizations for links and corrections?
- What monthly baseline and success metrics should be used?

## Recommended workflow

1. Use `/grill-with-docs` to settle scope, editorial workflow, initial markets, and success criteria.
2. Use `/to-spec` after the open questions are settled.
3. If the resulting build spans multiple sessions, use `/to-tickets`, then `/implement` separately for each ticket.
