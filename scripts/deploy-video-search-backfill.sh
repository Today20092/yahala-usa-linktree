#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run test:video-search
npm run validate:data
npm run build
npx wrangler deploy

ADMIN_TOKEN="$(
  security find-generic-password \
    -a yahala-usa-linktree \
    -s 'Cloudflare ADMIN_API_TOKEN' \
    -w
)"

curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer ${ADMIN_TOKEN}" \
  'https://yahalausa.net/api/admin/video-search/reindex?max=500'

printf '\nBackfill queued. Vectorize will populate asynchronously.\n'
