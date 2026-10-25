# Versioning and releases

## Source of truth and compatibility

The application version is `package.json#version`; synchronize the top-level version and root package version in `package-lock.json` when preparing a release. Both currently record `0.0.1`. This is source metadata, not proof of the publicly deployed version. No stable release target is selected by this policy.

Compatibility covers the website routes `/`, `/about`, and `/stories`; existing viewer navigation, story browsing, outbound links, and search workflows; maintainer-owned content/configuration inputs; and maintained Worker integration contracts and stored service data. Site content may change without promising identical catalog entries or search results. Internal refactoring is compatible when these workflows continue to work and any stored data migrates safely.

A migration must preserve maintainer-authored data and explain any required configuration or integration change. There is no promise that an older deployment can consume a newer schema unless explicitly verified.

## Selecting a version

Apply [Semantic Versioning 2.0.0](https://semver.org/) to that contract. Select the highest required increment in a release batch.

| Change | At 1.0 and later | During 0.y.z development |
| --- | --- | --- |
| Compatible fix or small UI refinement | Patch | Patch |
| Compatible new functionality | Minor | Minor |
| Breaking route, workflow, configuration, or integration change | Major, with migration/recovery notes | Minor, with explicit breaking-change and migration/recovery notes |

Reset lower components when incrementing a higher component. UI additions follow the functionality rule; visual size does not determine compatibility. Documentation-only changes can accompany the next application release. Routine catalog refreshes and deployments do not automatically require a version change; track their source revision separately. Once a version is released, changed release contents require a new version.

Pre-1.0 compatibility is unsettled; the table is this project's convention, not a SemVer compatibility guarantee. Target 1.0.0 when the owner accepts maintaining the documented contract and recommends the core workflows for use. This guide neither selects that target nor retrospectively labels the current deployment.

Readiness suffixes are optional:

- `-alpha.N`: incomplete or experimental core behavior.
- `-beta.N`: intended workflows ready for broader testing.
- `-rc.N`: proposed stable release awaiting final verification.
- No suffix: recommended and maintained for the documented purpose, with limitations stated.

These stages need not occur in sequence. Stable does not mean finished or fully tested on every environment. Record a proposed target separately from the current package and published versions.

## Actual automation

[CI](../.github/workflows/ci.yml) validates pushes and pull requests to `development` and `main`, and supports manual dispatch. [Deploy](../.github/workflows/deploy.yml) builds and deploys pushes to `main` and manual runs on `main` only. [YouTube refresh](../.github/workflows/refresh-youtube-data.yml) validates and commits refreshed content to `development` without deployment. [Preview smoke](../.github/workflows/preview-smoke.yml) runs on pull requests and manual dispatch.

These are the migrated local configurations. GitHub still runs the legacy `master` configuration until remote cutover. Follow [the Git workflow and migration record](branch-workflow.md) for integration, promotion, and the remaining cutover steps.

These workflows do not establish a version-tag publication pipeline. A production deployment and a versioned release are distinct records. Live repository settings and external Cloudflare integrations have not been verified here.

## Preparing a release

1. Identify the reviewed source revision and its intended version/readiness. Synchronize package and lockfile identities to an unused version. Preserve historical release records.
2. Prepare release notes with changed behavior, breaking changes, migration/recovery, and known limitations. Check current status/help wording against the intended readiness. Identify the actual artifact or source revision being verified.
3. Follow `npm ci` and the relevant checks defined by CI and package scripts. The current CI baseline is `npm run test:branch-workflow`, `npm run validate:data`, `npm run validate:ui`, `npm run test:locations`, and `npm run build`. Preview smoke additionally uses `npm run test:preview-smoke` and `npm run smoke:preview -- dist`. Add focused behavior checks appropriate to the change. Record actual results and browser/device checks separately; a build does not establish real viewer behavior.
4. Inspect current automation for branch triggers, hard-coded versions, prerelease flags, notes, and channels. Review resulting candidate metadata before publication. Confirm source identity and intended promotion destination before any push that can deploy.
5. Follow the preview/production authorization boundaries in [AGENTS.md](../AGENTS.md). Use its pinned preview configuration for authorized development deployments. Tags, production deployment, and publication require scope covering those actions.
6. After an authorized publication, verify the public version or deployed revision and actual viewer workflows. Record publication separately from preparation and authorization, including any checks omitted or failed.

This policy-only change performs none of these release actions. AGENTS.md links to this guide; the selected instruction improvements are recorded in [the foundation review](project-foundation-review.md).
