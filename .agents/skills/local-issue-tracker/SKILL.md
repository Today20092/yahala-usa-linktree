---
name: local-issue-tracker
description: Manage this repository's local Markdown issue tickets and tracker. Use when creating, reading, triaging, updating, closing, or publishing an issue or specification; never use GitHub Issues for this repository.
---

# Local issue tracker

Read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.

## Workflow

1. Read `issues/README.md` and relevant ticket files.
2. For a new ticket, copy `issues/TEMPLATE.md` to `issues/NNNN-short-title.md` using the next unused number.
3. Keep `status` and `triage` frontmatter current.
4. Add or update the ticket link in `issues/README.md`.
5. Commit the ticket and tracker changes with the related work.

Do not create, edit, label, or close GitHub Issues.
