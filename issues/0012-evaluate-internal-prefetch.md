---
status: open
triage: needs-triage
branch: perf/evaluate-internal-prefetch
---

# 12 — Evaluate prefetch for internal page navigation

## Context

The site now has three internal Astro pages. Astro prefetch may improve perceived
navigation among them, but most prominent links are external and should not be
prefetched. This is useful only if the internal links are discoverable and the
extra transfer produces a meaningful navigation benefit.

## Branch strategy

Evaluate and, only if justified, implement on
`perf/evaluate-internal-prefetch`. Keep this separate because prefetch changes
network behavior rather than page functionality.

## Acceptance criteria

- [ ] Inventory visible links among `/`, `/about`, and `/stories`; do not broaden
      prefetch to outbound links.
- [ ] Measure or otherwise demonstrate a user-visible navigation benefit under a
      mobile network profile before enabling prefetch.
- [ ] If adopted, choose the least eager Astro prefetch strategy that provides the
      benefit and verify it does not trigger material unwanted transfers.
- [ ] If the benefit is negligible, close the ticket without adding the feature
      and record the evidence.
- [ ] Preserve normal navigation, keyboard behavior, reduced-data expectations,
      and production build output.

## Dependencies

None.
