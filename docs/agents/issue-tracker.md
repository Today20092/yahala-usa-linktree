# Issue tracker: GitHub

Issues and specifications for this repository live as GitHub Issues. Use the `gh` CLI from the repository clone so the remote is inferred automatically.

## Conventions

- Create issues with `gh issue create` and use a file for multi-line bodies.
- Read issues and comments with `gh issue view <number> --comments`.
- List work with `gh issue list`, filtering by state and the configured triage labels.
- Apply or remove labels with `gh issue edit`.
- Close an issue only after its acceptance criteria are satisfied.

## Pull requests as a triage surface

External pull requests are not treated as feature requests or triage inputs. GitHub Issues are the planning surface; pull requests are implementation work.

## Publishing

When an engineering skill says to publish a specification or ticket to the issue tracker, create a GitHub Issue in `Today20092/yahala-usa-linktree`.

When tickets have blockers, use GitHub's native issue dependencies when available. Otherwise, include a `Blocked by: #<issue>` line in the ticket body.
