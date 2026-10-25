# Dependency update — 2026-09-20

Updated 19 direct dependencies to their current stable releases and refreshed compatible transitive dependencies. Highlights: Astro 7.3.3, React 19.3.0, Motion 13.4.0, Astro's Prettier plugin 1.0.1, shadcn 4.21.0, and Wrangler 4.135.0. The complete versions are in `package.json` and `package-lock.json`. Packages already current, including Tailwind, were retained.

## Compatibility decisions

- **TypeScript stays at 6.0.3.** The latest `@astrojs/check` (0.9.10) declares `typescript: ^5.0.0 || ^6.0.0`. TypeScript 7.0.2 is available, but TypeScript 7.0 does not provide the compiler API used by ecosystem tools. Revisit when Astro's checker declares support; no forced peer overrides were added. [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- **Astro 7.1.5 → 7.3.3:** the reviewed changes require no application migration for this static site. New managed preview commands are relevant to agent work. Changes involving MDX escaping, server sessions, custom adapters, image services, and experimental incremental builds do not require configuration changes here. [Astro changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)
- **Motion 12 → 13:** automatic Emotion prop validation became explicit injection. This project uses Motion hooks rather than Emotion/Styled Components composition, so no migration is required. [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide)
- **Astro Prettier plugin 0.14 → 1:** the formatter now uses Astro's Rust compiler and requires Node 22.12+. With the previous `htmlWhitespaceSensitivity: "ignore"`, repeated formatting removed a space after an inline element in `about.astro`. Switching to `"css"` preserves it and passes the formatter's stability check for all 14 Astro files. No wholesale reformat was applied. [Plugin changelog](https://github.com/withastro/prettier-plugin-astro/blob/main/CHANGELOG.md)
- **React types:** replaced deprecated `FormEvent` with `SubmitEvent` in the search form handler.
- **GitHub Actions:** upgraded `actions/setup-node` from v4 to v7 in four workflows and `actions/setup-python` from v6 to v7 in the refresh workflow. The workflows use GitHub-hosted Ubuntu runners and no removed `pip-install` input. Application Node remains 22. Other referenced actions already use the latest major. [Node setup release](https://github.com/actions/setup-node/releases/tag/v7.0.0), [Python setup release](https://github.com/actions/setup-python/releases/tag/v7.0.0)

## Agent instructions

Replaced the longer Astro-specific block in `AGENTS.md` with task-triggered instructions for managed dev and preview servers, readiness checks, lifecycle commands, restarting after dependency updates, runtime logs, and TypeScript compatibility. Optional logging configuration now points to authoritative documentation instead of copying API examples into always-loaded instructions. [Astro AI workflow](https://docs.astro.build/en/guides/build-with-ai/)

## Verification

- Dependency tree resolves without peer errors; only TypeScript remains in `npm outdated` for the reason above.
- `npm audit`: **0 vulnerabilities**, down from 21 before the update.
- `npm run check`: 0 errors, 0 warnings, 3 unused-code hints.
- Data and UI validation pass, along with all 12 `test:*` scripts.
- Production build and `smoke:preview -- dist` pass.
- Prettier `--debug-check` passes for all 14 Astro files.
- Managed dev and preview servers start successfully; `/`, `/stories`, and `/about` return HTTP 200 on both. Dev health returns `{"ok":true}`.
- Build still reports the missing optional `src/icons` directory; the configured icon packages render and the build succeeds.

Local verification does not execute the GitHub-hosted workflows or validate Cloudflare deployment behavior. No deployment was performed.
