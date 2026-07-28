---
status: closed
triage: ready-for-agent
---

# 02 — Introduce a shared branded page-document seam

## Context

Every branded Ya Hala page needs one small Astro interface that applies the production theme imports, Atlas activation, global document behavior, and shared metadata invariants while leaving each page’s content and layout independent.

Continue on `feature/brand-collaborations` and commit this ticket separately before starting 03.

## Acceptance criteria

- [x] Home, About Page, and Story Browser use one shared seam for production styling and document initialization.
- [x] Callers no longer need to know CSS import order or repeat Atlas activation attributes and global styling invariants.
- [x] Page-specific layouts, metadata values, structured data, and content remain independently configurable.
- [x] Desktop and mobile rendering, the production build, and UI consistency validation pass.

## Dependencies

[01 — Make semantic tokens the single styling authority](0001-semantic-token-authority.md).
