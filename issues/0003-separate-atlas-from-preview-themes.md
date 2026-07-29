---
status: closed
triage: ready-for-agent
---

# 03 — Separate production Atlas styling from preview themes

**What to build:** Make Atlas the explicit production styling implementation and isolate Field and Night behind a preview-only seam, retaining those adapters only when current usage proves they are still needed.

**Blocked by:** 01 — Make semantic tokens the single styling authority; 02 — Introduce a shared branded page-document seam.

**Status:** completed after 02

**Branch strategy:** Continue on `feature/brand-collaborations` after 02 and commit this ticket separately before starting 04.

- [x] Production pages depend directly on the Atlas styling implementation rather than a preview-oriented cascade.
- [x] Field and Night usage is verified before removal; retained alternatives are reachable only through the preview seam.
- [x] Atlas styling no longer depends on selectors or initialization intended only for alternate design experiments.
- [x] Home, About Page, and Story Browser retain their approved appearance and responsive behavior.
- [x] The production build and UI consistency validation pass.
