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
- Current Cloudflare Worker deployment in mobile Chromium: five referenced assets return successfully with correct content types, QR opens and closes, Leaflet initializes with tiles and markers, and the console reports no warnings or errors.
- Hydration boundary: QR behavior comes from an inline module and the map/state browser from hydrated React islands. Both enhance in Chromium after the Worker's nonce-based CSP is applied; local Astro does not apply that CSP.
- Brave was not installed in the implementation environment; run the mobile journey there before treating a shared preview as the known-good checkpoint.
