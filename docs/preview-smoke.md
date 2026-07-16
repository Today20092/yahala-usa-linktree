# Cloudflare preview smoke baseline

Use a Cloudflare version preview, never a production deployment, while diagnosing the landing page. Uploading with `wrangler versions upload --preview-alias <name>` creates a version without moving traffic; do not run `wrangler versions deploy` or `wrangler triggers deploy` during this check.

## Automated asset boundary

```sh
npm run build
npm run smoke:preview -- dist
npm run smoke:preview -- https://<preview-url>
```

The local check fails when production HTML references a missing CSS or JavaScript file. The URL check fails on non-successful asset responses or incorrect CSS/JavaScript content types. Both checks also require the server-rendered reach section, QR control, map, state browser, and latest-story action. The URL result reports whether the Worker supplied a Content Security Policy.

The `Preview smoke` GitHub Actions workflow repeats both checks against a supplied preview URL after Cloudflare propagation.

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

- Local Astro development: production HTML contains the five smoke markers and local assets build successfully.
- Current Cloudflare Worker deployment in mobile Chromium: QR opens and closes, Leaflet initializes with tiles and markers, and the console reports no warnings or errors.
- Runtime boundary: the deployed Worker adds a nonce-based CSP; local Astro development does not. The smoke command checks that all HTML-referenced client assets survive that boundary.
- Brave was not installed in the implementation environment; run the mobile journey there before treating a shared preview as the known-good checkpoint.
