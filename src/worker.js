const PRIMARY_HOST = 'yahalausa.net'
const REDIRECT_HOSTS = new Set([
  'www.yahalausa.net',
  'yahalausa.co',
  'www.yahalausa.co',
])

const createNonce = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

const createContentSecurityPolicy = (nonce) =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https://i.ytimg.com https://tile.openstreetmap.org",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ')

const SECURITY_HEADERS = {
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers)
  const contentType = headers.get('content-type') ?? ''
  const nonce = createNonce()

  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    headers.set(header, value)
  })
  headers.set('Content-Security-Policy', createContentSecurityPolicy(nonce))

  const securedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })

  if (!contentType.includes('text/html')) return securedResponse

  return new HTMLRewriter()
    .on('script', {
      element(element) {
        element.setAttribute('nonce', nonce)
      },
    })
    .transform(securedResponse)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (REDIRECT_HOSTS.has(url.hostname)) {
      url.hostname = PRIMARY_HOST
      return Response.redirect(url.toString(), 301)
    }

    if (url.pathname === '/api/video-search' && request.method === 'GET') {
      return handleSearch(request, env)
    }

    if (
      url.pathname === '/api/admin/video-search/reindex' &&
      request.method === 'POST'
    ) {
      return handleAdminReindex(request, env)
    }

    if (
      url.pathname === '/api/admin/video-search/status' &&
      request.method === 'GET'
    ) {
      return handleAdminStatus(request, env)
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request))
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runScheduledSync(env))
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        const result = await processVideo(env, message.body?.videoId)
        console.log('Video indexing completed', result)
        message.ack()
      } catch (error) {
        if (isYouTubeQuotaError(error)) {
          const result = await deferVideo(
            env,
            message.body?.videoId,
            'youtube-quota-exhausted',
            {
              error: error instanceof Error ? error.message : String(error),
            },
          )
          console.warn('Video indexing deferred', result)
          message.ack()
          continue
        }

        console.error('Video indexing failed', {
          videoId: message.body?.videoId,
          error: error instanceof Error ? error.message : String(error),
        })
        message.retry()
      }
    }
  },
}
import {
  deferVideo,
  handleAdminReindex,
  handleAdminStatus,
  handleSearch,
  isYouTubeQuotaError,
  processVideo,
  runScheduledSync,
} from './worker/video-search.js'
