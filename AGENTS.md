- YaHala is a link hub with a landing page (`/`), an About Page (`/about`), a filterable Story Browser (`/stories`), and a partnership contact page (`/contact`).
- built with astro & tailwind & shadcn
- hosted on cloudflare pages/workers and linked to the github repo that we push to
- uses shadcn components and color tokens
- site variables are at `src/data/site.yaml`

## Project map and UI conventions

- `src/pages/` owns the public routes; shared page framing lives in `src/layouts/`.
- `src/components/` contains Astro sections and React islands; reuse `src/components/ui/` primitives and shared color tokens. For UI changes, read [the consistency rules](docs/ui-consistency.md) and run `npm run validate:ui`.
- Colors, tokens, page layout wrappers and theme behavior follow [the design system](docs/design-system.md); `npm run validate:ui` and `npm run test:contrast` enforce it.
- After UI changes, follow [the accessibility test workflow](docs/accessibility-testing.md): cached source lint while editing, the focused browser check for changed interactions, and the default rendered gate before handoff. Shared-token/component changes also require affected consumers and themes. Record incomplete/manual checks; a passing scan is not full WCAG conformance.
- `src/data/` holds site content and generated story catalogs; `scripts/` holds refresh, validation, and regression commands.
- `src/worker.js` and `src/worker/` provide Cloudflare service behavior. For search provisioning or credentials, read [the search setup](docs/video-search-setup.md); Astro development serves the UI without emulating those bindings.
- Follow [the Prettier configuration](prettier.config.cjs) when formatting touched files.

## Cloudflare development deployment

- The shared development target is the Worker named `yahala-usa-linktree-atlas-preview` in the Haithum Cloudflare account. Its account ID is pinned in `wrangler.preview.jsonc`; do not probe or deploy to the Ayoub account.
- Build and deploy the current working tree with `npm run build` followed by `npx wrangler deploy --config wrangler.preview.jsonc`.
- Development URL: https://yahala-usa-linktree-atlas-preview.haithum-alqahaf.workers.dev
- This is the development/preview Worker. Do not use `wrangler.jsonc` or deploy the production Worker unless the user explicitly requests production.

## Agent skills

### Issue tracker

Issues and specifications are Markdown files in `issues/`; do not use GitHub Issues. Use the `local-issue-tracker` skill and see `docs/agents/issue-tracker.md`.

### Triage labels

Use the standard `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix` label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. Read the root domain context and relevant architectural decisions when they exist. See `docs/agents/domain.md`.

### Releases

For version selection, release-status wording or release preparation, read [the versioning policy](docs/releasing.md).

### Git workflow

For branch setup, pull requests, merging or cleanup, read [the Git workflow](docs/branch-workflow.md). Start feature branches from `main` and target PRs at `main`; merging triggers automatic production deployment.

## Verification

Install the lockfile dependencies with `npm ci`; CI uses Node 22. Run commands from the repository root.

For the CI baseline, read [the validation workflow](.github/workflows/ci.yml). Choose focused checks from [package scripts](package.json) for the behavior changed. Report checks actually run and their results separately from commands verified only by inspection.

For example, `npm run test:visited-map` checks map behavior without running the whole suite. Accessibility regressions also have focused `scripts/test-*-accessibility.mjs` checks; run the relevant script directly with Node when changing those interactions.

## Astro development and verification

- Start a managed development server with `npm run dev -- --background`. Confirm readiness at `/_astro/status` (`{"ok":true}`).
- For phone or Tailscale previews, use `npm run dev -- --host 0.0.0.0 --background` so the server accepts network connections. If the existing server listens only on localhost, stop it with `npm run astro -- dev stop` before starting it with `--host`; verify the Tailscale health URL as well as localhost.
- After changes affecting compilation or production output, run `npm run build`. For production-output checks, start a managed local server with `npm run preview -- --background` and verify the affected routes; the health endpoint is dev-only.
- Inspect, read logs, or stop either server with `npm run astro -- <dev|preview> <status|logs|stop>`. Reuse the server recorded in `.astro/dev.json` or `.astro/preview.json`; after dependency upgrades, restart it before verification.
- Use `--json` for machine-readable logs. Inspect server logs when verifying runtime behavior.
- When changing server lifecycle or logging configuration, consult [Astro's AI workflow](https://docs.astro.build/en/guides/build-with-ai/) and [CLI reference](https://docs.astro.build/en/reference/cli/). Local Astro preview and the Cloudflare development Worker are separate targets.
- When upgrading TypeScript, first check `@astrojs/check` peer compatibility. Keep TypeScript 6 until the checker supports TypeScript 7's compiler API changes.

## Large outputs and session recovery

Before bulk file/log analysis, multi-page web extraction, or recovery of earlier decisions, read [the context-mode routing guide](docs/agents/context-mode.md). It defines bounded output, tool routing, and the fallback when context-mode is unavailable.
