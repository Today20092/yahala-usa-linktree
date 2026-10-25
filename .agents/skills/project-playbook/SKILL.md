---
name: project-playbook
description: Set up a new repository or audit an existing project's agent instructions, specifications, Git workflow, and release policy. Use when assembling or refreshing a reusable project foundation.
---

# Project playbook

One entry point for the owner's recurring repository setup. Adapt the collection to the project; the linked skills remain authoritative for their workflows.

## Discover

Read applicable agent instructions and the repository's existing contributor, tracker, domain, and release documentation. Inspect manifests, check commands, CI triggers, branches, and working-tree changes. Preserve established conventions and unfinished work.

Locate the skills below by name in the session catalog, then in user skill roots (`~/.agents/skills`, `~/.codex/skills`) and repository `.agents/skills`. Read the selected skill before applying it. If unavailable, mark that route unavailable and continue independent work; a similarly named skill is not an assumed replacement.

Completion: each applicable area has a verified existing home, a concrete gap, or an explicit unknown.

## Choose the route

| Area | Skill | When to reach it |
| --- | --- | --- |
| Agent-facing writing | `writing-for-agents` | Before writing instructions, skills, or their supporting documents. |
| Agent instruction review | `agents-md-field-study` | Review root and nested AGENTS.md against repository evidence. |
| Tracker foundation | `setup-matt-pocock-skills` | Tracker, triage vocabulary, or domain-document locations are missing. |
| Local tickets | `local-issue-tracker` | The repository supplies this skill and uses local Markdown issues. |
| Specifications | `to-spec` | An agreed idea needs a buildable specification in the configured tracker. |
| Ticket breakdown | `to-tickets` | A specification needs dependency-ordered implementation slices. |
| Git policy | `project-git-workflow` | Establish a new project's branch roles or explicitly migrate an existing workflow. |
| Release policy | `project-versioning` | Establish compatibility, version increments, readiness, and release preparation. |
| Domain language | `domain-modeling` | Resolve terminology or an architectural decision; reuse the project's existing context/glossary layout. |
| Documentation entry point | `readme-organizer` | The README needs verified onboarding and links to deeper guides. |

These are routes, not a mandatory sequence. For setup, settle instruction and tracker foundations before publishing specs, and discover Git/release triggers before proposing branch or release policy. For an existing project, work only on the requested gaps.

Some routes are explicitly user-invoked. Check `disable-model-invocation` and any invocation policy in `agents/openai.yaml`. When a route requires explicit invocation and the user has not invoked it, give the exact `$skill-name` to use and the reason it applies. Continue the other authorized routes. Preserve the child skill's selection and approval gates; a general setup request does not select all AGENTS.md recommendations.

Completion: the selected work is distinguished from recommendations and routes waiting for invocation.

## Apply and verify

Use canonical project documents and short conditional pointers. Keep workflow rules in their owning skill and project decisions in their owning repository; this collection is an index, not a second policy manual.

For a requested reusable checklist or saved setup audit, adapt [the project record](assets/project-setup.md) into an existing onboarding guide or `docs/project-setup.md`. Replace the prompts with verified facts, use relative links to actual documents, and omit irrelevant areas. Keep specs in the configured tracker. Record only unresolved decisions and links to authoritative results.

Document policy without implying a version bump, tag, deployment, publication, or branch migration. Perform those actions only when the user's request covers them. Preserve existing tools; hook setup, new release automation, implementation orchestration, and platform-specific scaffolding are separate work.

Check local links, documented commands against manifests/CI, whitespace, and the scoped diff. On a repeat run, update existing homes and omit satisfied work rather than adding another setup layer.

Completion: every selected gap is resolved or has a specific blocker, every retained link resolves, and the user receives the changed paths, remaining decisions, actual verification, and a short next invocation when needed.
