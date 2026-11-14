# Accessibility checks for agents

## Real dark theme — November 14, 2026

Earlier `*-dark` runs emulated `prefers-color-scheme` while the layout forced
light, so they tested the light theme. Every axe scan now first asserts that
`<html>` carries the project's theme class and that the body background is dark
or light accordingly (`tests/accessibility/theme.ts`). Removing the boot
script's `dark` toggle from built `/about` makes `desktop-dark` fail. A new test
covers the stored preference before first paint, the footer System/Light/Dark
control by keyboard, persistence across routes, `color-scheme`, `theme-color`
and live system changes. `npm run test:atlas-polish` checks every primitive
token pair in both themes. The full six-project matrix (150 tests), lint,
Astro check, UI validation, build and preview smoke passed. The CSP nonce on
the inline boot script was not verified on the preview Worker.

## State picker fallback — November 12, 2026

The homepage state picker now serves a native GET form before hydration or when
JavaScript is unavailable. It enhances to the existing searchable picker only
if the visitor has not started using the form, preserving selection and focus.
The view-statistics description-list correction is already present on `main`.

The new no-JavaScript keyboard test failed on unchanged `main` because no native
state select existed. After the fix, all six focused cases and the complete
46-test mobile-light/desktop-dark browser gate passed. Delayed-script tests
confirm that hydration keeps an active form's state and focus; normal loading
retains searchable selection and explicit navigation. Lockfile installation,
Astro check, accessibility lint, data/UI validation, branch-workflow checks,
all CI regression scripts and production build/asset smoke checks also passed.
Two existing unused-code hints and existing icon-directory/chunk-size build
notices remain.

Port 4337 belongs to another local app. An ignored `.cache` configuration copy
ran the unchanged browser projects against an isolated Vite preview on 4345;
the runner closed it after each run. Evidence is in `.cache/pr-rendered.log`,
`.cache/pr-checks.log` and `.cache/artifacts/a11y-report/`.
The extended six-project matrix, Lighthouse, real screen readers and physical
devices were not run locally. No conformance or deployment claim is made.

Target WCAG 2.2 AA and the usability/consistency checks in the shared `web-ui-accessibility` skill. This project uses complementary source checks, rendered browser checks, Astro Audit, and guided manual review. The skill's automation reference is maintained through Rulesync; project commands and evidence stay here.

## First setup

Use Node 22.22.3 or newer in the Node 22 line (CI installs the latest Node 22), then:

```sh
npm ci
npx playwright install chromium
```

On a new Linux host use `npx playwright install --with-deps chromium`. Browser setup is a one-time cost per Playwright version. `package-lock.json` pins compatible versions. The Astro plugin supports `eslint-plugin-jsx-a11y-x`; it is selected because its ESLint 10 peer range matches the installed Astro lint plugin. No forced peer dependency resolution is used.

## Fast workflow

1. While editing, run `npm run lint:a11y`. It caches source checks for `.astro` and React `.jsx`/`.tsx`; the cache lives under `.cache/` and never ships. The local Radio component is explicitly recognized as a form control.
2. For a changed interaction, build current output once, then run the relevant test, for example `npm run test:a11y -- --grep contact`. These tests use the real built React/Astro UI, not source-pattern matching.
3. Before handoff run `npm run a11y`: lint, build once, then the default browser gate. If that exact output was already built and unchanged, run `npm run test:a11y` to avoid another build. Also run the project's focused behavior regressions for changed components and `npm run validate:ui`.
4. For shared layout/token changes or responsive/theme issues, run `npm run test:a11y:full` against the same build. Review incomplete axe results and the manual checklist below. Report actual commands/results and remaining gaps.

The default browser gate has ten tests: all four public routes plus the contact interaction flow, in 320px/light and 1280px/dark projects. The extended matrix adds 320px/dark, 1280px/light, 390px/light, and 768px/dark. Both use Chromium with reduced motion, zero retries, two workers, and one local build server. Use Playwright's `--grep`/`--project` for focused diagnostics; avoid running the extended matrix after every small edit.

The browser runner starts an isolated Vite static preview on `127.0.0.1:4337`. Vite is already installed through Astro; this avoids loading Astro integrations and leaves managed development/preview records untouched. Port conflicts fail visibly. It serves the same Astro-built `dist/`; it never builds implicitly or deploys. Stop an orphan test server before rerunning, rather than reusing unknown output. Use the normal managed Astro servers for development and integration-specific checks.

## Automated coverage and evidence

- Accessibility lint: recommended Astro and JSX accessibility rules, failing on warnings/errors.
- Axe: whole-page WCAG A/AA rules through 2.2 for all four routes. Violations fail the run. Every scan attaches both violations and incomplete results; incomplete items require review, not an automatic conformance claim.
- Explicit contrast: homepage partnership action at rest/actual hover, contact submit hover, and a representative input boundary. The browser resolves OKLCH and alpha colors; input boundaries require 3:1, ordinary action text 4.5:1. The contrast helper assumes flat backgrounds; axe/manual inspection covers other contexts.
- Contact behavior: real Tab and arrow-key selection, invalid required/email focus, preserved entries, mocked delivery success/failures, security-check retry, duplicate activation prevention, status text, enlarged text/spacing, clipped-control detection, and forced-colors visibility. Verification scripts and API responses are intercepted; tests do not send real email.
- Existing `test:accessibility` scripts retain focused QR, search, share, and motion seams. Use them for relevant changes; they complement the browser gate.
- The browser gate also checks QR opening by Enter, initial dialog focus, Escape dismissal and return focus, plus the rendered reduced-motion bento state. It verifies each route's canonical URL so a homepage fallback cannot silently pass as another page.

On failure open `artifacts/a11y-report/index.html` (or run `npx playwright show-report artifacts/a11y-report`). The report links screenshots, traces, and axe JSON. `artifacts/a11y-results/*/axe-review.json` also retains incomplete findings on successful scans. Reports/caches are ignored. CI runs cached lint, builds once, caches/installs Chromium, runs the default gate, and uploads failure artifacts. No additional runtime bundle is added to the public website.

## Local speed check

Single Lighthouse runs vary by 0.1 or more, so do not judge speed from one run. `npm run perf:lighthouse` builds into a temporary folder (never `dist/`), runs Lighthouse on the four pages 5 times each (`-- --runs=3` or `LH_RUNS=3` to change), and prints the median and min-max of score, LCP, TBT, CLS, and transfer size. CI uses 3 runs per page via `lighthouserc.json`. It needs Chromium (`CHROME_PATH` or the Playwright install above).

## Astro Audit during design

The existing Astro development toolbar is explicitly enabled in `astro.config.mjs`. Start the managed development server with the project’s normal command and inspect the toolbar's Audit panel after design changes. It checks common accessibility/performance issues while developing. It is not included in production builds and does not replace the CI browser gate.

## Accessibility Insights and manual checks

Install [Accessibility Insights for Web](https://accessibilityinsights.io/downloads/) from the official Chrome/Edge extension link on the developer’s chosen browser. This is a per-browser installation, not an npm dependency or a headless CI tool. No extension was installed into personal browser profiles by this setup.

After a UI revision, use **FastPass** for automatic checks and its tab-stop visualizer. Use **Assessment** for guided manual review; its documented baseline is WCAG 2.1 AA, so also apply the skill's 2.2 checks (including focus not obscured and target sizes).

Record these checks separately from the automated gate:

- Can a person identify the main action, predict its result, finish the task and recover from failure? Check heading hierarchy, grouping, reading order and wording in context. Automation does not prove good UX.
- Follow the keyboard through the complete changed flow, including sticky navigation, dialogs, visible/unobscured focus, and return focus. Check screen-reader announcements with a real assistive technology session.
- Inspect 320px, phone, tablet and desktop; 200% text; actual 400% browser zoom; simultaneous text-spacing overrides; long content; and relevant error/selected/loading/empty states. CSS font scaling is not actual browser zoom.
- Check reduced motion, forced colors, touch without hover, and real Android/Brave when relevant. Browser emulation is not the physical phone.
- Review axe incomplete findings. For the Cnippet radios, verify the title referenced by `aria-labelledby` and the separate `aria-describedby` description; confirm actual announcements when screen-reader access is available.

Keep rules enabled when they reveal old defects. Fix the responsible layer, or report a precise blocker with evidence. Document narrowly justified exceptions; do not introduce a blanket baseline that silently accepts current failures.

## Research and sources

- [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing): axe integration, state coverage and automation limits.
- [Playwright CI](https://playwright.dev/docs/ci): browser installation and CI setup.
- [Astro dev toolbar](https://docs.astro.build/en/guides/dev-toolbar/): built-in Audit app.
- [Astro accessibility lint setup](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/): Astro/JSX configurations and compatible peer requirements.
- [Accessibility Insights overview](https://accessibilityinsights.io/docs/web/overview/): automated FastPass, tab stops and guided manual assessment.

Local measurements and remaining gaps are recorded below after validation. These four tools are free/open-source; browser extensions remain a manual setup step. No tool or combination establishes conformance without the corresponding human evaluation.

## Validation notes — November 5, 2026

Release verification reran `npm ci` successfully after the interrupted tool host
was recovered, and the complete 30-test matrix passed on the integrated catalog.
CI now runs `test:a11y:full` so the existing automatic dependency merge guard
covers every `test:*` entry. The earlier installation and CI limitations below
describe the initial setup, not this later release verification.

The initial browser gate caught low contrast in bar-list labels and accessible names that omitted visible link text in social links, story cards and bento links. Those were fixed in the shared components. On a 320px map, the previous minimum zoom prevented `fitBounds` from keeping cluster targets inside the viewport; allowing zoom level 2 resolved the observed clipped targets. A named map shell now exposes a region role. Source lint also caught redundant native-dialog ARIA and generic component patterns needing explicit children/labels. These checks failed before the corrections; no blanket violation baseline was added.

Cached source lint passed in 1.06 seconds. The final default suite passed ten tests in 13.7 seconds; the broader matrix passed thirty in 37.9 seconds on this Windows machine before the final small map-region correction. Browser download, first dependency install and build costs are separate. Both suites use one in-process Vite preview with explicit cleanup to avoid slow Windows process-tree shutdown; the final default run verified that port 4337 was closed afterward. `vite.a11y.config.mjs` serves Astro directory indexes without an SPA homepage fallback. CI wiring is configured locally; no remote CI run or deployment was started.

The lockfile installation attempt (`npm ci`) hit Windows `EPERM` on native modules held by running development processes. `npm install` restored the dependency tree successfully, with locked stale-directory cleanup warnings. A fresh-host `npm ci` remains unverified locally; CI uses that command. The installed lint, build and browser checks were subsequently run successfully. npm's audit also reported an existing critical MapLibre 5.x advisory requiring a major-version migration; this accessibility setup does not perform that unrelated upgrade.

Axe incomplete findings are retained in the reports. Gradient/overlap and image-backed text can prevent automatic contrast determination; assess their actual visible regions manually. The radios deliberately reference their visible titles and separate descriptions; verify their spoken names with a screen reader. The QR `aria-controls` target exists in the DOM and the Enter/Escape/return-focus test exercises it; axe can still mark the hidden dialog relationship incomplete. These items are not included in a claim of complete conformance.

Real screen-reader evaluation, actual 400% browser zoom, physical Android/Brave, and the guided Accessibility Insights session remain manual. The forced-colors check verifies control visibility/enabled state, not all system-color contrast. Contact tests exercise mocked direct-send success, server/verification/network failures, retry, and duplicate activation; production verification and inbox receipt remain separate checks.

## Landing layout validation — November 12, 2026

Scope: homepage composition and map supporting content, plus the shared header width and bilingual accessible name. The existing shadcn Button variants and Cnippet-derived searchable selection and BarList remain the UI reference. No new registry code or dependencies were added.

Executed on macOS with Node 22.23.5: npm ci; Astro/TypeScript check (0 errors, 2 existing unused-code hints); accessibility lint; UI consistency; production build; navigation, reach-chart, visited-map, story-coverage and accessibility regressions; built-output smoke; and preview Worker dry-run packaging. Impeccable layout detection returned no findings. Existing icon-directory, chunk-size and Wrangler module-rule notices remain.

The full Chromium matrix passed 78/78 tests in 1.3 minutes. After the final header-name correction, the eight route landmark/name/contrast/reflow cases passed again in mobile-light and desktop-dark. Port 4337 was occupied by another app: an ignored config/setup copy ran the same suite against an isolated Vite server at 4338. The server closed after each run. Local reports are under .cache/artifacts/a11y-results and .cache/artifacts/a11y-report.

OpenCode browser-extension inspection covered the desktop hero, reach, gallery, loaded map and compact support grid, latest/featured pairing, and phone hero. State selection exposed the Texas browse destination. Rendered measurements confirmed all major homepage blocks share a 1152px desktop grid. Additional Chromium checks found no horizontal overflow at 320, 390, 768, 1280 or 1728px, or with 200% root text plus simultaneous spacing overrides at 320px. Forced-colors keyboard checks verified the visible skip link, main focus transfer and visible unobscured hero-action focus. Supporting measurements are in .cache/landing-layout.

Axe incomplete findings were reviewed: image-backed gallery labels/gradient and overlapping About text need contextual contrast review; contact radio relationships require a real screen reader; the hidden QR dialog relationship is covered by the Enter/Escape/return-focus test. A passing matrix is bounded evidence, not WCAG conformance.

SquirrelScan 0.0.43 ran offline against the local production preview, quick coverage, maximum four pages; it actually crawled one page because canonical/sitemap URLs target production. Its initial score was 49/F (125 passed, 18 warnings, 7 failed); after fixing the bilingual header name it was 52/F (126 passed, 18 warnings, 6 failed). Both raw reports remain in .cache/landing-layout/squirrel*.json. This is a local-origin diagnostic, not a production score: HTTP/security headers and sitemap-domain findings reflect the static localhost server; repeated logos intentionally have empty alternative text beside their names; the Base UI hidden input requires rendered interpretation. Large HTML, metadata/content, and privacy-page warnings were not expanded into this layout change. No report was published.

Not completed: actual 400% browser zoom, physical-device testing, real screen-reader announcements, guided Accessibility Insights, or Astro toolbar Audit inspection. The static/local Astro servers do not emulate the Worker search-availability endpoint. Cloudflare deployment could not run because Wrangler OAuth was expired and the renewal attempt timed out. The local production preview at http://localhost:4324 and development server at http://localhost:4323 were left running for review; the shared preview and production were not changed.

PR verification used a clean branch from origin/main at e83fc74, preserving its rounded platform totals and per-platform dates. Lockfile installation, all 25 local check/build/regression/smoke commands, and the full 78-test Chromium matrix passed again on that branch. The stylesheet conflict was resolved without changing the newer reach component or data. Lighthouse was not rerun locally; the PR CI retains that gate.
