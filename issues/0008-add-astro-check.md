---
status: closed
triage: ready-for-agent
branch: chore/add-astro-check
---

# 08 — Add Astro type and template checking

## Context

`astro build` compiles the site but does not perform Astro's full type and template
diagnostics. The repository has no `astro check` script and does not currently list
`@astrojs/check`.

Add one repeatable validation command so local work and CI can catch Astro,
TypeScript, and template diagnostics before deployment.

## Branch strategy

Implement on `chore/add-astro-check`. Keep this separate from feature work because
new diagnostics may reveal pre-existing problems that need explicit, reviewable
corrections.

## Acceptance criteria

- [x] Add the minimum development dependency required by the installed Astro
      version to run `astro check`.
- [x] Add a clearly named package script for the check.
- [x] The new command exits successfully on the repository.
- [x] Fix only diagnostics required to make the check pass; avoid unrelated type
      cleanup.
- [x] Document the command in the repository's existing validation guidance if
      such guidance exists.
- [x] `npm run build` still passes.

## Dependencies

None.
