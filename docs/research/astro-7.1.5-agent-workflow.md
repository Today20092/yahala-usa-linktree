# Astro 7.1.5 agent-workflow review

_Research date: 2026-07-28. Primary Astro sources only._

## Bottom line

No `AGENTS.md` update is required. Its Astro 7 instructions still match the
current official guidance: detected coding agents run `astro dev` in detached
background mode, Astro records the managed server in `.astro/dev.json`,
`astro dev stop/status/logs` manage it, and `/_astro/status` reports dev-server
readiness ([Astro AI guide](https://docs.astro.build/en/guides/build-with-ai/),
[Astro CLI reference](https://docs.astro.build/en/reference/cli-reference/#astro-dev)).

## What changed from 7.0.1 to 7.1.5

- Astro 7.1.0 added `astro dev --ignore-lock`, which allows a second,
  untracked dev server. It cannot be combined with `--background`, automatic
  AI-agent background mode, or `--force`, and that server is invisible to
  `astro dev stop/status/logs`
  ([7.1.0 changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#710),
  [implementation PR #17331](https://github.com/withastro/astro/pull/17331)).
- Astro 7.1.0 also allows a URL as a custom logger `entrypoint`; this does not
  affect the repository unless it adds a custom logger
  ([implementation PR #17389](https://github.com/withastro/astro/pull/17389)).
- Astro 7.1.1 through 7.1.5 contain fixes and dependency updates, but no
  additional changes to the agent-managed dev-server workflow. The current
  `--background`, lock-file, health-endpoint, JSON-log, and management-command
  behavior remains documented unchanged
  ([Astro changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md),
  [logger reference](https://docs.astro.build/en/reference/logger-reference/)).
- The older 7.0.1 release fixed false background-mode detection in Warp and
  improved `--host`/status reporting; those fixes require no project-rule
  change
  ([7.0.1 changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#701)).

## Recommendation

Keep the existing `AGENTS.md` section. Its instruction not to spawn a second
server already covers `--ignore-lock`. An explicit “do not use
`--ignore-lock`” line would only repeat that rule; add it later only if agents
actually misuse the flag.
