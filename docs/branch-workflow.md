# Git workflow

## Make a change

`main` is the only long-lived branch. Each task gets its own branch and pull request into `main`; there is no integration branch and no stacked PRs.

1. Work in a worktree the host manages, based on current `origin/main`. A T3 Code thread on the main checkout moves itself with `t3_worktree_handoff` before editing; the project's worktree script runs `npm ci`. Without host worktree tools, use `git worktree add` and run `npm ci`.
2. Commit work in progress instead of using `git stash`: stashes are shared by every worktree.
3. Make and verify the change using the checks in [CI](../.github/workflows/ci.yml): type checking, data/UI validation, workflow checks, the `test:*` scripts, build and built-asset smoke verification. See [the accessibility workflow](accessibility-testing.md) for UI changes.
4. End every code task with a commit and a pull request to `main`, without being asked. Opening a PR is safe; only a merge deploys.
5. Watch the PR's checks (`Validate and build`, `smoke`) and fix failures until they pass.
6. Merge only when the user asks, with a merge commit. To merge without waiting, queue it: `gh pr merge --auto --merge`. GitHub merges once the required check passes.
7. After the merge, CI runs on `main` and Deploy runs only when it passes. Confirm the Deploy run succeeds.

`development` and `master` are legacy branches; preserve any unfinished work on them until it has been recovered into feature PRs.

## Synchronization

Fetch with `git fetch origin` before choosing a base. Use `git pull --ff-only` to advance a local `main`; inspect divergent commits and merge deliberately. Never force-push `main`.

Several PRs at once: `main` does not require a PR to be current with it, so each PR merges once its own checks pass, with no "Update branch" round. CI runs again on the merge commit; a failure there stops the deploy, and the fix goes forward in a new PR.

A Cloudflare preview is optional and can be deployed directly from the feature branch with the pinned configuration in [AGENTS.md](../AGENTS.md).

## Deployment and authorization

Opening or updating a PR runs checks. Merging it into `main` changes production source; CI then runs on the merge commit, and when it passes the [Deploy workflow](../.github/workflows/deploy.yml) deploys that exact commit. Production updates only after both succeed.

Publishing a PR and merging it are separate actions. A request to create a PR does not authorize merging it; authorization to merge into `main` covers its automatic production deployment. Feature-branch pushes do not deploy production.

Tags and versioned releases are separate from deployment. Follow [the release policy](releasing.md) when preparing them.

## Automation

| Workflow | Behavior |
| --- | --- |
| [CI](../.github/workflows/ci.yml) | Checks PRs to `main`, pushes to `main`, and manual dispatches. |
| [Deploy](../.github/workflows/deploy.yml) | Deploys production after CI passes on a push to `main`, checking out that CI run's commit; manual runs are restricted to `main`. |
| [Preview smoke](../.github/workflows/preview-smoke.yml) | Checks PR assets and optionally a supplied preview URL; does not deploy. |
| [Catalog refresh](../.github/workflows/refresh-youtube-data.yml) | Refreshes from `main`, verifies the catalog, and opens or updates one `automation/youtube-catalog` PR to `main`. |
| [Dependabot](../.github/dependabot.yml) | Monthly: one grouped minor-and-patch PR per ecosystem, majors one PR each, 7-day cooldown. PRs to `main`, merged by hand. |

Catalog PRs use GitHub Actions' token, so the refresh explicitly dispatches CI and Preview smoke on the catalog branch after creating or updating its PR. These runs check the PR head and report the same `Validate and build` and `smoke` check names used by PR runs. GitHub's repository setting allowing Actions to create pull requests must be enabled. Token-created PR event runs may separately await approval; review and approve those runs if GitHub requests it before merging. See [GitHub's token-trigger rules](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow). The catalog and dependency bots do not merge their own PRs or deploy production.

## Repository controls

`main` requires a pull request, the `Validate and build` check and resolved conversations; rules apply to administrators, and force pushes and deletion are blocked. It does not require branches to be up to date: Deploy waits for CI on the merge commit, so that rule would only turn several open PRs into serial update-and-retest rounds. Auto-merge is allowed and merged branches are deleted automatically.

## Cleanup

GitHub deletes a merged PR's branch. Inspect temporary branches and worktrees for uncommitted work, unmerged commits, and needed ignored files before retiring them. Use the managed archive mechanism for managed worktrees when available. Remote deletion and history rewriting require authorization covering those actions.
