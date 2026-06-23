- this is linktree type of website for YaHala.
- single page landing site
- built with astro & tailwind & shadcn
- hosted on cloudflare pages/workers and linked to the github repo that we push to
- uses shadcn components and color tokens
- site variables are are at `src/data/site.yaml`

## Astro 7 AI development workflow

- This project uses Astro 7. Follow Astro's agent-oriented development workflow when running and testing the site.
- Start the development server with `npm run dev`. Astro 7 detects AI coding agents and automatically runs the server as a managed background process. When explicit behavior is useful, run `npm run dev -- --background`.
- Do not start unmanaged long-running dev-server processes, add sleeps, poll terminal output for readiness, or spawn a second server. Astro's `.astro/dev.json` lock file prevents duplicate project servers and returns the existing server details.
- Use `npm run astro -- dev status` to inspect the managed server, `npm run astro -- dev logs` to read its logs, and `npm run astro -- dev stop` to stop it. These commands are safe to run even when the agent has lost track of server state.
- Confirm readiness with the dev-only health endpoint at `/_astro/status`; a ready server returns `{"ok":true}`.
- Prefer machine-readable logs during agent work. Background mode enables JSON logging automatically when Astro detects an AI agent. To request it explicitly, use `npm run dev -- --json`.
- If project-wide structured logging is needed, configure the Astro 7 Logger API in `astro.config.mjs` with `logHandlers.json()`. Use `logHandlers.compose()` only when both human-readable console output and JSON output are required.
- Run `npm run build` after changes that may affect compilation or production output. Check managed dev-server logs when runtime behavior also needs verification.
- Astro AI workflow reference: https://docs.astro.build/en/guides/build-with-ai/
