# Git workflow

## Make a change

1. Start a feature branch or managed worktree from current `origin/main`.
2. Make and verify the change using the checks in [CI](../.github/workflows/ci.yml).
3. Push the feature branch and open a pull request targeting `main`.
4. Review the exact diff and passing checks, then merge when authorized.
5. GitHub Actions rebuilds the merged source and deploys production to Cloudflare. Confirm that the Deploy run succeeds.
6. Delete the merged feature branch and remove its finished worktree after accounting for local and ignored files.

`main` is the default and release branch. `development` and `master` are legacy branches; preserve any unfinished work on them until it has been recovered into feature PRs. New work and releases use the steps above.

## Synchronization and verification

Fetch with `git fetch origin` before choosing a base or integrating changes. Use `git pull --ff-only` when the current branch can advance without divergence. Inspect divergent commits and preserve wanted work when merging.

Run `npm ci`, then the checks in [CI](../.github/workflows/ci.yml), including type checking, data/UI validation, workflow checks, regression tests, build, and built-asset smoke verification. Add focused behavior checks for the change and record omissions. See [the accessibility workflow](accessibility-testing.md) for UI changes.

A Cloudflare preview is optional and can be deployed directly from the feature branch with the pinned configuration in [AGENTS.md](../AGENTS.md). It does not require an intermediate Git branch.

## Deployment and authorization

Opening or updating a PR runs checks. Merging it into `main` changes production source and automatically starts the [Deploy workflow](../.github/workflows/deploy.yml). Production updates only after that workflow succeeds.

Publishing a PR and merging it are separate actions. A request to create a PR does not authorize merging it; authorization to merge into `main` covers its automatic production deployment. Feature-branch pushes do not deploy production.

Tags and versioned releases are separate from deployment. Follow [the release policy](releasing.md) when preparing them.

## Automation

| Workflow | Behavior |
| --- | --- |
| [CI](../.github/workflows/ci.yml) | Checks PRs to `main`, pushes to `main`, and manual dispatches. |
| [Deploy](../.github/workflows/deploy.yml) | Rebuilds and deploys production on pushes to `main`; manual runs are restricted to `main`. |
| [Preview smoke](../.github/workflows/preview-smoke.yml) | Checks PR assets and optionally a supplied preview URL; does not deploy. |
| [Catalog refresh](../.github/workflows/refresh-youtube-data.yml) | Refreshes from `main`, verifies the catalog, and opens or updates one `automation/youtube-catalog` PR to `main`. |
| [Dependabot](../.github/dependabot.yml) | Opens dependency-update PRs to `main` for review and merging. |

Catalog PRs use GitHub Actions' token, so the refresh explicitly dispatches CI and Preview smoke on the catalog branch after creating or updating its PR. These runs check the PR head and report the same `Validate and build` and `smoke` check names used by PR runs. GitHub's repository setting allowing Actions to create pull requests must be enabled. Token-created PR event runs may separately await approval; review and approve those runs if GitHub requests it before merging. See [GitHub's token-trigger rules](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow). The catalog and dependency bots do not merge their own PRs or deploy production.

## Cleanup

Inspect temporary branches and worktrees for uncommitted work, unmerged commits, and needed ignored files before retiring them. Use the managed archive mechanism for managed worktrees when available. Remote deletion and history rewriting require authorization covering those actions.
