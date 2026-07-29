---
name: local-issue-tracker
description: Manage this repository's local Markdown issue tickets and tracker. Use when creating, reading, triaging, updating, closing, or publishing an issue or specification; never use GitHub Issues for this repository.
---

# Local issue tracker

Read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.

## Workflow

1. Read `issues/README.md` and relevant ticket files.
2. For a new ticket, copy `issues/TEMPLATE.md` to `issues/NNNN-short-title.md` using the next unused number.
3. Determine the implementation branch before writing the ticket:
   - Reuse the dependency ticket's branch for sequential work.
   - Otherwise use the current non-default branch or name the intended feature branch.
   - Never omit the branch or leave it undecided in a `ready-for-agent` ticket.
4. Record the branch in frontmatter and explain the branch strategy in the ticket body. Tickets in one dependency chain must use one branch unless the ticket explicitly justifies a split.
5. Keep `status`, `triage`, and `branch` frontmatter current.
6. Add or update the ticket link in `issues/README.md`.
7. Commit the ticket and tracker changes with the related work.

Do not create, edit, label, or close GitHub Issues.
