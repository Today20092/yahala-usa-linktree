#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

pnpm run test:video-search
pnpm run validate:data
pnpm run build
pnpm exec wrangler deploy

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
