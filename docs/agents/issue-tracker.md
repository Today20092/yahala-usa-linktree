# Issue tracker: local Markdown

Issues and specifications for this repository live in `issues/` and are committed with the code. Do not create or update GitHub Issues.

## Conventions

- Copy `issues/TEMPLATE.md` to `issues/NNNN-short-title.md`.
- Use the next unused four-digit number.
- Determine the implementation branch before publishing the ticket.
- Reuse the dependency ticket's branch for sequential work.
- Keep the ticket's status, triage role, and branch in its frontmatter.
- Include a branch-strategy section. Dependency-chain tickets stay on one branch unless a split is explicitly justified.
- Add every ticket to `issues/README.md`.
- Close a ticket only after its acceptance criteria are satisfied, then set its status to `closed`.
- Commit ticket and tracker changes to the repository.

## Pull requests as a triage surface

Pull requests are implementation work, not a triage surface. Capture requests as local issue files.

## Publishing

When an engineering skill says to publish a specification or ticket, create or update the local Markdown ticket and tracker. Express dependencies with relative links to other ticket files.
