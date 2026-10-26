---
status: open
triage: needs-info
branch: feature/structured-content-collections
---

# 10 — Adopt content collections when structured content outgrows site YAML

## Context

`src/data/site.yaml` remains the simplest source for one coherent site
configuration. A content collection becomes justified when stories, episodes,
sponsors, events, or another category becomes a set of independently authored
records needing schema validation, querying, loaders, or individual routes.

This ticket is intentionally waiting for that product/content trigger. Do not
migrate the singleton configuration speculatively.

## Branch strategy

When triggered, implement on `feature/structured-content-collections`. Put the
collection schema, the migration of one qualifying content category, and its
immediate consumers on this branch. Unrelated categories stay in YAML until they
independently qualify.

## Acceptance criteria

- [ ] Identify a concrete content category with independently managed records and
      record why direct YAML no longer serves it well.
- [ ] Define the smallest collection loader and schema that validates the fields
      actually consumed by the site.
- [ ] Migrate only that qualifying category; retain global site configuration in
      `src/data/site.yaml`.
- [ ] Update existing consumers without creating a second source of truth.
- [ ] Preserve current URLs, ordering, optional-field behavior, and build output.
- [ ] Add one focused validation check that fails for an invalid representative
      entry.
- [ ] Run the production build and relevant content/UI checks.

## Dependencies

Waiting for a qualifying content category and its publishing requirements.
