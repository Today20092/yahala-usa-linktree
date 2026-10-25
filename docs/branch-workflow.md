# Git workflow

## Branch roles

- `development` is the everyday working and integration branch. Sequential solo work can commit directly here. Push useful checkpoints as backups when authorized.
- `main` contains reviewed release source and is the intended GitHub default branch after cutover. A push to `main` triggers production deployment, so promotion needs production authorization.
- Temporary `codex/<scope>` branches and managed worktrees isolate parallel work. Start from current `development` and integrate finished changes back there. External contributions target `development`.
- `master` is retained as the legacy branch during migration. Preserve existing branches and worktrees until their work and integrations have been accounted for.

For compatibility, version increments, and readiness, read [the release policy](releasing.md).

## Synchronization and integration

Fetch with `git fetch origin` before synchronization decisions. Once matching remote upstreams exist, use `git pull --ff-only` when the branch can advance without divergence. Inspect divergent commits and merge deliberately while preserving both histories.

Merge completed scoped branches into `development`, then verify the combined source. Later feature-branch changes need another integration before they are in the development build. A merge does not rebuild an existing artifact.

Run `npm ci`, then `npm run test:branch-workflow`, `npm run validate:data`, `npm run validate:ui`, `npm run test:locations`, and `npm run build`. Run focused package tests for the behavior changed. Before promotion, also run `npm run test:preview-smoke` and `npm run smoke:preview -- dist`, plus relevant viewer checks. Record the source revision, results, tested artifacts, and omissions. For authorized development deployment, use the pinned preview target in [AGENTS.md](../AGENTS.md).

## Promotion

Open a tested `development` to `main` PR when authorized. Use a merge commit to preserve ancestry. Squash merges remain acceptable for isolated dependency updates into `development`; promotion uses a merge commit. GitHub's merge-commit option was verified enabled during discovery.

Publishing a PR does not authorize merging or deploying production. Review the exact source and checks before promotion. Merge main-only fixes and release metadata back into `development` before the next batch. Preserve reviewed behavior when resolving conflicts.

Version tagging, release publication, source promotion, and deployment are separate actions. Keep release records tied to actual source and artifact identities.

## Automation after cutover

| Workflow | Branch behavior |
| --- | --- |
| [CI](../.github/workflows/ci.yml) | Pushes and PRs to `development` or `main`, plus manual dispatch. |
| [Deploy](../.github/workflows/deploy.yml) | Pushes to `main`, plus manual dispatch on `main` only. Deploys production. |
| [Preview smoke](../.github/workflows/preview-smoke.yml) | PRs and manual dispatch. Checks assets and optionally a supplied preview URL; it does not deploy. |
| [Catalog refresh](../.github/workflows/refresh-youtube-data.yml) | Scheduled from the default branch, or manually dispatched on `main`. Checks out `development`, validates/builds before committing there, and does not deploy. |
| [Dependabot](../.github/dependabot.yml) | Version-update PRs target `development`. Security-update PRs may still target the default branch and need human review. |
| [Dependency auto-merge](../.github/workflows/dependabot-auto-merge.yml) | Successful CI for eligible patch/minor dependency PRs targeting `development` only. |

Catalog commits made with `GITHUB_TOKEN` do not normally trigger another push workflow. The refresh workflow therefore runs its checks before committing. Catalog updates reach production through reviewed promotion. This replaces the old daily direct production refresh.

See GitHub's [scheduled workflow rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [Dependabot target-branch behavior](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#target-branch) for the default-branch cases.

## Migration record and cutover

The user selected this workflow on October 25, 2026. Discovery found GitHub default branch `master`, no remote `main` or `development`, merge commits enabled, and open PRs #3, #32, and #39. Those PRs have not been retargeted or merged.

The fetched legacy source was `03d89dd`. Prior playbook work was saved at `68384ce`; merge commit `b89916a` retains both that history and the fetched source. Local `main` preserves the legacy source. Local `development` contains the verified migration after local integration. Other checkouts, unfinished work, and local `master` are preserved.

Local validation passed the branch-boundary check, data/UI validation, location tests, preview-smoke tests, build, and built-asset smoke check. The build completed with a missing optional `src/icons` directory warning. These checks establish the local candidate; they do not establish live Actions behavior or production health.

Remote cutover is pending authorization covering these actions:

1. Fetch again and account for new legacy commits and in-progress catalog refreshes before final integration. Retain a recoverable legacy ref and all needed files.
2. Publish `development`, promote the reviewed migration into `main` with a merge commit, and publish `main`. Publishing migrated `main` starts production deployment; confirm that consequence explicitly before doing it.
3. Change GitHub's default branch to `main`. Verify merge commits remain available and inspect protection/rulesets before updating them. Retarget open implementation and version-update PRs to `development`, then check their diffs and CI.
4. Inspect external Cloudflare/Git integrations for legacy `master` deployment settings. Confirm the intended production source, preserve the pinned Haithum preview account, and verify production and the next catalog refresh after cutover.
5. Configure local upstreams to matching remote branches once they exist. Keep scoped branches until their work is integrated and verified; use `development` for subsequent sequential work.

Until cutover, GitHub's existing `master` workflows and default branch remain active. Local edits do not change remote behavior. Remote protection settings and external Cloudflare branch configuration have not been verified.

## Cleanup

Inspect temporary branches/worktrees for uncommitted or unmerged work and needed ignored files before retiring them. Use the managed archive mechanism for managed worktrees. Remote deletion and history rewriting require authorization covering those actions.
