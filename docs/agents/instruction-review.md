# Agent instruction review

Reviewed November 5, 2026 during consolidation into `development`, using the `agents-md-field-study` study notes and `writing-for-agents`. The user requested the subagent review and implementation of suitable findings. This is a documentation review, not a product specification.

## Existing guidance retained

There is one root [AGENTS.md](../../AGENTS.md) and no nested instruction file. Its pinned preview account, explicit production boundary, managed Astro server lifecycle, local Markdown tracker, domain terminology, and Git/release pointers already address concrete project risks.

The incoming `development` history already corrected the outdated single-page description, supplied conditional context-mode routing with an unavailable-tool fallback, and added CI and release-policy discovery. These improvements were retained instead of duplicated. The existing [foundation review](../project-foundation-review.md) records the earlier setup; it remains historical evidence.

## Findings applied

| Priority | Section | Evidence and consequence | Applied change |
| --- | --- | --- | --- |
| 1 | Project map and UI conventions | The repository separates route files, shared layouts, components, data, scripts, and Worker code. The earlier overview only identified site.yaml, making these ownership boundaries harder to find. | Added a compact map of existing directories and the Worker entry point. |
| 1 | UI conventions | [UI consistency](../ui-consistency.md) requires shared primitives/tokens and `validate:ui`; [Prettier config](../../prettier.config.cjs) defines formatting. Neither was directly discoverable from the root instructions. | Linked the authoritative rules and formatter instead of copying their settings. |
| 1 | Worker search boundary | [Search setup](../video-search-setup.md) distinguishes Astro's static UI from Cloudflare bindings and supplies credential/provisioning instructions. Treating Astro development as the complete backend would overstate verification. | Added a conditional pointer and the local-runtime limitation next to the Worker ownership map. |
| 2 | Setup and focused verification | [CI](../../.github/workflows/ci.yml) installs with `npm ci` on Node 22; [package scripts](../../package.json) include `test:visited-map`, while accessibility tests also exist as direct Node scripts. | Added the root-directory setup command and concrete focused-check discovery, preserving CI as the full baseline. |

## Playbook disposition

- Tracker, template, triage vocabulary, and [domain context](../../CONTEXT.md) already exist. No tracker replacement, new domain model, or ADR is needed for this documentation task.
- [Git workflow](../branch-workflow.md) and [release policy](../releasing.md) remain the canonical integration and publication guides. The parent agent handles branch consolidation and its verification record.
- No new product idea needs a specification or ticket breakdown. No nested instruction file is justified by the current three-route application.
- Long context-mode reference text was retained: conditional routing already handles its availability, and relocating it would add another document without fixing a remaining behavioral defect.

## Verification and limits

Checked the documented paths, package-script names, Node setup, formatting configuration, instruction-file scope, and relative Markdown links against repository files. Reviewed the scoped diff and whitespace. The instruction-review pass changed only AGENTS.md and this report; it did not change CI, deployment configuration, or application behavior.

In the subsequently requested workflow clarification, updated [the Git workflow](../branch-workflow.md) and [release guide](../releasing.md) to support both combined development previews and direct completed-feature PRs to main. Updated the two corresponding shared skills through their canonical Rulesync source. Skills-only generation was previewed, applied to the four configured agents, and checked as up to date; the shared consistency checker and both skill validators passed. Existing AGENTS.md pointers already reach the updated guides.

Build and regression execution belong to the parent's combined-source verification. This documentation review does not claim browser, assistive-technology, service provisioning, remote branch-setting, or production verification. The field-study observations were used as review prompts, not as a checklist score or a target word count.
