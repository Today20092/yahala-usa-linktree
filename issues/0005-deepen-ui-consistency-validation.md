---
status: closed
triage: ready-for-agent
branch: feature/brand-collaborations
---

# 05 — Deepen automated UI consistency validation

**What to build:** Keep one fast UI validation command while deepening its implementation to enforce the semantic-token authority, branded page seam, production Atlas separation, and feature-style locality established by the preceding tickets.

**Blocked by:** 01 — Make semantic tokens the single styling authority; 02 — Introduce a shared branded page-document seam; 03 — Separate production Atlas styling from preview themes; 04 — Restore locality to feature styling.

**Status:** completed after 02–04

**Branch strategy:** Finish the series on `feature/brand-collaborations` as its own commit, then run the full validation suite and review the combined branch.

- [x] Validation fails when a branded page bypasses the shared styling seam or production Atlas activation.
- [x] Validation detects duplicate semantic-token ownership and forbidden hardcoded presentation values at the appropriate trust surfaces.
- [x] Validation protects the agreed global-versus-feature styling seam without requiring a new CSS parser or dependency.
- [x] Existing icon, shadow, and page-color checks remain covered.
- [x] The validator provides actionable file-level messages and passes across the compliant codebase.
