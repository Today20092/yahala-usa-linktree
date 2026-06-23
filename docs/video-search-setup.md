# Semantic video search setup

The application code is ready, but the Cloudflare resources and Google OAuth
credentials must be created in the account that deploys `yahalausa.net`.

## 1. Google OAuth

1. In Google Cloud Console, enable **YouTube Data API v3** for a project.
2. Configure an OAuth consent screen and create a Web or Desktop OAuth client.
3. Authorize the Google account that owns the Ya Hala channel with:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube.force-ssl`
4. Exchange the authorization code once and retain the refresh token.
5. Store the values as Worker secrets:

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put ADMIN_API_TOKEN
```

The refresh token is server-only. Never add it to `.dev.vars`, GitHub logs, or
the repository.

## 2. Cloudflare resources

Create the resources named in `wrangler.jsonc`:

```sh
npx wrangler r2 bucket create yahala-video-transcripts
npx wrangler vectorize create yahala-video-search --dimensions=1024 --metric=cosine
npx wrangler vectorize create-metadata-index yahala-video-search --property-name=channelId --type=string
npx wrangler vectorize create-metadata-index yahala-video-search --property-name=landscape --type=boolean
npx wrangler queues create yahala-video-index
npx wrangler queues create yahala-video-index-dlq
```

The Vectorize dimension must match the configured Workers AI model
`@cf/baai/bge-m3`. If the model changes, create a matching index and re-index
the transcripts.

## 3. Deploy and backfill

Deploy through the existing GitHub/Cloudflare workflow. Then enqueue a small
sample:

```sh
curl -X POST \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  "https://yahalausa.net/api/admin/video-search/reindex?max=5"
```

Check Worker and Queue logs, test Arabic and English searches, and then enqueue
the complete channel:

```sh
curl -X POST \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  "https://yahalausa.net/api/admin/video-search/reindex"
```

To retry one video:

```sh
curl -X POST \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  "https://yahalausa.net/api/admin/video-search/reindex?videoId=VIDEO_ID"
```

The daily Cron Trigger runs at 08:17 UTC. Videos without owner-visible source
dimensions or downloadable captions are written to R2 as skipped manifests and
are never included in search.

## 4. Local development

Create a local `.dev.vars` file containing the four secrets above and run:

```sh
npx wrangler dev
```

Astro's normal `npm run dev` serves the static UI but does not emulate the
Cloudflare bindings used by `/api/video-search`.
