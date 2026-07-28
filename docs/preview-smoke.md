# Cloudflare preview smoke baseline

Use a Cloudflare version preview, never a production deployment, while diagnosing the landing page. Uploading with `wrangler versions upload --preview-alias <name>` creates a version without moving traffic; do not run `wrangler versions deploy` or `wrangler triggers deploy` during this check.

## Automated asset boundary

```sh
npm run build
npm run smoke:preview -- dist
npm run smoke:preview -- https://<preview-url>
```

The local check fails when production HTML references a missing CSS or JavaScript file. The URL check fails on non-successful asset responses or incorrect CSS/JavaScript content types. Both checks also require the server-rendered reach section, QR control, map, state browser, and latest-story action. The URL result reports whether the Worker supplied a Content Security Policy.

The `Preview smoke` GitHub Actions workflow runs the test and local boundary on every pull request. Dispatch it with a preview URL after Cloudflare propagation; do not share the URL until that run is green. This repository has no preview-deploy workflow to call automatically.

## Mobile journey

Run once in mobile Chromium and once in Brave with ordinary Shields settings:

1. Open the preview at a phone viewport and confirm there is no horizontal scroll.
2. Confirm **People reached** and its platform values render before interacting.
3. Open **QR code**, confirm **Share this page** appears, then close it with the button and Escape.
4. Scroll to **Places Ya Hala Has Visited**. Confirm map tiles and markers appear; keep the Network panel filtered to failed requests.
5. Select **Illinois**, confirm its city/story choices appear, and open one story drawer.
6. Open the **Latest From Ya Hala** action and confirm its YouTube URL is present.
7. Record console errors, failed network requests, blocked CSP directives, and the preview URL. Repeat with JavaScript disabled: reach values, state choices, and the latest-story link must remain in the initial HTML; interactive map and QR dialog may not enhance.

## 2026-07-16 baseline

- Local Astro development: production HTML contains the five smoke markers, six referenced CSS/JavaScript assets exist, and no CSP is applied by Astro.
- Isolated preview: `https://yahala-usa-linktree-atlas-preview.haithum-alqahaf.workers.dev`. Its six referenced assets return successfully with correct content types after propagation, and the response includes the Worker's nonce-based CSP.
- Mobile Chromium at 375 pixels reproduces the failure without horizontal overflow: the QR control is inert and the map remains an empty server-rendered shell. The console reports no warnings or errors; the only failed network request is a CSP-blocked Google Fonts stylesheet.
- Hydration boundary: the raw response contains 12 nonce-bearing scripts, including all seven inline modules, but Chromium requests none of the Astro module assets. All eight Astro islands keep their `ssr` marker, the QR handler never attaches, and Leaflet never mounts. The failure is inline-module bootstrap execution after the Worker's CSP rewrite, not missing build assets.
- With JavaScript disabled, the reach values, four platform labels, QR control, state choices, Illinois option, and latest-story link remain in the initial HTML.
- Brave was not installed in the implementation environment; run the mobile journey there before treating a shared preview as the known-good checkpoint.

## 2026-07-16 QR reliability check

- Version preview: `https://3bc4346f-yahala-usa-linktree-atlas-preview.haithum-alqahaf.workers.dev`. The automated asset boundary passes with six assets and the Worker's CSP.
- Local Chromium opens the QR dialog at 320, 375, 414, 768, and 1280 pixels without horizontal overflow. Focus enters the close control and returns to the mobile or desktop trigger after the close control, backdrop, and Escape paths.
- With JavaScript disabled at 375 pixels, the fragment fallback exposes the QR image and linked destination without horizontal overflow.
- Deployed Chromium at 375 pixels opens and closes the enhanced dialog under the Worker's CSP with focus return and no console errors from the deployed origin.
- Brave remains outstanding because it is not installed or connected in this environment.
