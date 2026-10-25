# Git workflow

## Branch roles

- `development` is the everyday working and integration branch. Sequential solo work can commit directly here. Push useful checkpoints as backups when authorized.
- `main` contains reviewed release source and is the GitHub default branch. A push to `main` triggers production deployment, so promotion needs production authorization.
- Temporary `codex/<scope>` branches and managed worktrees isolate parallel work. Start from current `development` and integrate finished changes back there. External contributions target `development`.
- `master` is retained as the legacy branch during migration. Preserve existing branches and worktrees until their work and integrations have been accounted for.

For compatibility, version increments, and readiness, read [the release policy](releasing.md).

## Synchronization and integration

Fetch with `git fetch origin` before synchronization decisions. Once matching remote upstreams exist, use `git pull --ff-only` when the branch can advance without divergence. Inspect divergent commits and merge deliberately while preserving both histories.

Merge completed scoped branches into `development`, then verify the combined source. Later feature-branch changes need another integration before they are in the development build. A merge does not rebuild an existing artifact.

Run `npm ci`, then every check in [CI](../.github/workflows/ci.yml), including `npm run check`, data/UI validation, `npm run test:branch-workflow`, the full regression-test block, build, and built-asset smoke verification. Add focused tests and viewer checks for the behavior changed. Record the source revision, results, tested artifacts, and omissions. For authorized development deployment, use the pinned preview target in [AGENTS.md](../AGENTS.md).

## Promotion

Open a tested `development` to `main` PR when authorized. Use a merge commit to preserve ancestry. Squash merges remain acceptable for isolated dependency updates into `development`; promotion uses a merge commit. GitHub's merge-commit option was verified enabled during discovery.

Publishing a PR does not authorize merging or deploying production. Review the exact source and checks before promotion. Merge main-only fixes and release metadata back into `development` before the next batch. Preserve reviewed behavior when resolving conflicts.

Version tagging, release publication, source promotion, and deployment are separate actions. Keep release records tied to actual source and artifact identities.

## Automation

| Workflow | Branch behavior |
| --- | --- |
| [CI](../.github/workflows/ci.yml) | Pushes and PRs to `development` or `main`, plus manual dispatch. |
| [Deploy](../.github/workflows/deploy.yml) | Pushes to `main`, plus manual dispatch on `main` only. Deploys production. |
| [Preview smoke](../.github/workflows/preview-smoke.yml) | PRs and manual dispatch. Checks assets and optionally a supplied preview URL; it does not deploy. |
| [Catalog refresh](../.github/workflows/refresh-youtube-data.yml) | Scheduled from the default branch, or manually dispatched on `main`. Checks out `development`, validates/builds before committing there, and does not deploy. |
| [Dependabot](../.github/dependabot.yml) | Version-update PRs target `development`. Security-update PRs may still target the default branch and need human review. |
| [Dependency auto-merge](../.github/workflows/dependabot-auto-merge.yml) | Eligible patch/minor PRs targeting `development`, with bot identity and tested head/base checks. Dispatches integration CI after merging, never production deployment. |

Catalog commits made with `GITHUB_TOKEN` do not normally trigger another push workflow. The refresh workflow therefore runs its checks before committing. Catalog updates reach production through reviewed promotion. This replaces the old daily direct production refresh.

See GitHub's [scheduled workflow rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [Dependabot target-branch behavior](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#target-branch) for the default-branch cases.

## Migration record and cutover

The user selected this workflow and authorized full publication and production deployment on October 25, 2026. Discovery found GitHub default branch `master`, no remote `main` or `development`, and merge commits enabled.

The first fetched legacy source was `03d89dd`. Prior playbook work was saved at `68384ce`; merge commit `b89916a` retained both histories. Before publication, newer legacy automation at `51cbd4a` was integrated at `28ffba1`, retaining its tested-commit and bot identity checks while routing updates to development.

All 17 local CI checks and the built-asset smoke check passed. [Promotion PR #55](https://github.com/Today20092/yahala-usa-linktree/pull/55) passed GitHub CI and preview smoke, then merged with merge commit `be42c73`. The [production deployment](https://github.com/Today20092/yahala-usa-linktree/actions/runs/40225105243) and main CI succeeded. Live smoke verification passed at `https://yahalausa.net`, including CSP, and `/`, `/about`, and `/stories` returned HTTP 200.

Completed cutover actions:

1. Published `development` and `main`, changed the GitHub default to `main`, and verified merge commits remain enabled.
2. Fast-forwarded retained `master` to the migrated guards so future legacy pushes cannot use its old production workflow. All source history remains recoverable; the old local `master` and unrelated worktrees were preserved.
3. Retargeted open PRs #3, #32, #39, and #53 to `development` and inspected their resulting diffs. PR #3 remains conflicted; its feature work was preserved rather than merged as part of migration. The other PRs remain their own review tasks.
4. Synchronized `development` with the promotion merge and configured local `main`/`development` upstreams to their matching remote branches.
5. Inspected branch protection and rulesets. Branches were unprotected and the existing no-delete/no-force-push ruleset was disabled; these settings were preserved. No GitHub repository webhooks were configured.
6. Updated the retained GitHub Pages source reference and its `github-pages` environment branch policy from `master` to `main`, preserving its existing workflow build mode.

The [manual catalog verification](https://github.com/Today20092/yahala-usa-linktree/actions/runs/40225235824) was dispatched on `main` to exercise the workflow that checks out and writes `development` without deployment.

External Cloudflare Builds branch settings could not be inspected: its API returned HTTP 403 for the available OAuth credential, and the dashboard required sign-in. The production Worker and deployment history were read only within the pinned Haithum account. GitHub Actions production deployment is verified; a separate external Builds integration is not ruled out by that result.

## Cleanup

Inspect temporary branches/worktrees for uncommitted or unmerged work and needed ignored files before retiring them. Use the managed archive mechanism for managed worktrees. Remote deletion and history rewriting require authorization covering those actions.
