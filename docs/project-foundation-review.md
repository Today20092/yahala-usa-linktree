# YaHala project foundation review

Reviewed on October 25, 2026 from the source checked out on `codex/project-playbook`. This is an audit and proposal record, not a specification or an implementation ticket.

## Useful existing guidance

The root AGENTS.md names the product, content configuration, component/token conventions, and a concrete preview deployment boundary. The pinned Haithum preview account and production authorization rule prevent a consequential deployment mistake. It links to tracker, triage, and domain guidance instead of duplicating their details.

The tracker already has `issues/TEMPLATE.md` and `issues/README.md`; its policy requires branch ownership and acceptance criteria. `CONTEXT.md` supplies Story, Story Browser, and About Page terminology. There is one root AGENTS.md and no nested instruction file in this checkout.

## Prioritized recommendations

| ID | File/section | Evidence and consequence | Proposed change |
| --- | --- | --- | --- |
| A | AGENTS.md: context-mode routing | It declares context-mode available and mandates its tools, but this session exposes none. An agent cannot follow that route. | Make routing conditional on tool availability; retain bounded, filtered output through the available execution tools as the fallback. |
| B | AGENTS.md: opening overview | It calls the product a single-page site, while `src/pages/about.astro` and `src/pages/stories.astro` exist and CONTEXT.md names both workflows. | Describe the landing hub, About Page, and Story Browser; retain the site.yaml pointer. |
| C | AGENTS.md: verification | `package.json` has focused checks; `.github/workflows/ci.yml` runs data/UI validation, location tests, and build. Current guidance only names build and dev-server checks. | Add a short pointer to the CI workflow for the baseline and package scripts for focused checks. State that commands were inspected, not executed here. |
| D | AGENTS.md: release discovery | Package and lockfile versions agree at 0.0.1. There was no release guide. | Add: “For version selection, release-status wording or release preparation, read [the versioning policy](releasing.md).” In AGENTS.md the actual target must be `docs/releasing.md`. |

The user selected all four recommendations. A–D are applied in AGENTS.md: conditional context-mode routing with a bounded-output fallback, the current site overview, verification pointers, and the release-policy pointer. Existing deployment boundaries and tracker/domain conventions remain intact.

## Playbook setup record

The playbook was run against source revision `320b0c76e77512547114f6902a52bb744cd4e241` plus this worktree's uncommitted documentation and skill changes on October 25, 2026. This table records the current setup without replacing the linked policies.

| Area | Status | Authoritative document or evidence |
| --- | --- | --- |
| Purpose and supported workflows | Existing; README corrected | [README](../README.md) and [domain context](../CONTEXT.md). |
| Agent instructions | Selected improvements applied | [AGENTS.md](../AGENTS.md); A–D above. |
| Setup and verification | Existing; navigation added | [Local development](../README.md#local-development), [CI](../.github/workflows/ci.yml), and [package scripts](../package.json). All 16 Node script paths exist. Commands were inspected, not executed in this audit. |
| Specifications and tickets | Existing | [Tracker policy](agents/issue-tracker.md), [triage vocabulary](agents/triage-labels.md), [ticket template](../issues/TEMPLATE.md), and [tracker index](../issues/README.md). |
| Domain language and decisions | Existing | [CONTEXT.md](../CONTEXT.md) and [consumer rules](agents/domain.md). No ADR directory exists; no new architectural decision requires one. |
| Git integration and promotion | Development/main migration prepared locally | [Git workflow](branch-workflow.md) defines integration and promotion. Local CI checks both branches; deployment is restricted to `main`. GitHub cutover is pending. |
| Versioning and releases | Added earlier in this worktree | [Release policy](releasing.md), linked from AGENTS.md. Package and both root lockfile version fields agree at `0.0.1`. |
| Documentation entry point | Updated | [Project guides](../README.md#project-guides) links to the existing setup, tracker, domain, release, and preview guides. |

## Route decisions

The earlier selected instruction review and versioning work are already complete. The writing-for-agents reference governs the supporting docs; readme-organizer was used for documentation navigation, with its unslop reference applied to revised prose.

Tracker setup and domain layout already exist, so setup-matt-pocock-skills was not rerun. No new product idea or implementation breakdown was requested, so no specification or tickets were created. Existing ticket files and statuses remain unchanged.

The explicit-only skills remain available for the next relevant task: invoke `$to-spec` to turn an agreed feature into a specification, then `$to-tickets` when it needs dependent implementation slices. Invoke `$setup-matt-pocock-skills` only if changing the tracker foundation, or `$agents-md-field-study` for another instruction review. None is needed to finish the gaps selected in this run.

## Git migration selected

The user invoked project-git-workflow and selected the `development`/`main` migration. The [canonical Git guide](branch-workflow.md) records the local branches, preserved histories, automation changes, and remaining remote cutover. GitHub's default branch was verified as `master`; remote branch protection and external Cloudflare settings remain unverified. No remote branch publication, PR retargeting, production promotion, or deployment was performed.

## Other findings

- README.md links the selected Git workflow and distinguishes migrated local configuration from the still-active remote `master` configuration.
- Existing tracker, triage, and single-context domain setup is already present. Rerunning the setup skill would duplicate completed setup.
- Existing `docs/specs/ai-discoverability-plan.md` coexists with a tracker policy that publishes new specifications into `issues/`. Preserve the historical file and follow the configured tracker for new specs.
- No local version tags were found. Remote releases, branch protection, default branch, deployed version, account credentials, and live deployment health were not checked.

## Study coverage

Overview, setup/build, full/focused verification, quality, CI/Git, boundaries, and document links are applicable and covered by the findings above. Component/token conventions already give useful style guidance; CI is the concrete baseline, not a claim that every package test runs there. Monorepo-specific or nested-module instructions are not applicable to this single-context project. A reusable-package public API contract is not applicable; release compatibility concerns website routes, viewer workflows, configuration, and maintained integrations.

The review uses the installed field-study notes as descriptive evidence, not a checklist score or a target length. It does not independently reproduce the study.

## Deliverables

- [Project playbook skill](../.agents/skills/project-playbook/SKILL.md): portable source of the reusable collection.
- [Project record template](../.agents/skills/project-playbook/assets/project-setup.md): optional per-repository setup record.
- [Release policy](releasing.md): repository-specific versioning and preparation policy, linked from AGENTS.md.

The skill is also installed at `~/.codex/skills/project-playbook` for use across repositories. The repository copy is the maintained source; refresh the installed copy when changing it. Existing skills were left in place so their names and callers keep working.

## Verification performed

Both the repository skill and installed copy passed the bundled skill-creator validator using an isolated uv runtime with PyYAML. Their contents match, and every relative Markdown link in the new files resolves. Package scripts, workflow triggers, version metadata, and named source paths were checked by inspection. No application build, behavior tests, deployment, tag, publication, or remote configuration change was performed for these documentation and skill additions.

The playbook rerun checked instruction-file scope, the existence of package-script targets, version alignment, workflow triggers, and documentation navigation. The existing README badge group was retained; badge endpoints and rendered desktop/mobile layout were not checked. Documentation links, heading anchors, whitespace, and the scoped diff were checked after the edits.

The subsequent Git migration passed `test:branch-workflow`, `validate:data`, `validate:ui`, `test:locations`, `test:preview-smoke`, `build`, and `smoke:preview -- dist` on the combined source. The build reported a missing optional `src/icons` directory warning but completed successfully. Live Actions runs, browser behavior, production deployment, and catalog writes were not exercised. Remote migration remains pending authorization.
