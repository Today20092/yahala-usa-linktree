---
status: closed
triage: ready-for-agent
---

# 04 — Restore locality to feature styling

**What to build:** Concentrate feature-specific complex styling with the Ya Hala module that owns its markup, while keeping global styling limited to Tailwind and shadcn foundations, semantic tokens, typography, and genuinely shared primitives.

**Blocked by:** 03 — Separate production Atlas styling from preview themes.

**Status:** completed after 03

**Branch strategy:** Continue on `feature/brand-collaborations` after 03 and commit this ticket separately before starting 05.

- [x] Styling rules with one clear feature owner move behind that module’s seam without changing rendered behavior.
- [x] Global styling retains only rules that provide leverage across multiple callers or define the shared styling interface.
- [x] Tailwind remains the default for local layout and responsive composition; scoped CSS remains available for complex selectors that utilities would make less understandable.
- [x] No React adapter is introduced solely to style static Astro markup.
- [x] Representative feature modules pass desktop and mobile visual checks, the production build, and UI consistency validation.
