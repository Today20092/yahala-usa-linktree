const PRIMARY_HOST = 'yahalausa.net'
const REDIRECT_HOSTS = new Set([
  'www.yahalausa.net',
  'yahalausa.co',
  'www.yahalausa.co',
])

const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https://i.ytimg.com https://tile.openstreetmap.org",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self'",
    'upgrade-insecure-requests',
  ].join('; '),
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

const withSecurityHeaders = (response) => {
  const headers = new Headers(response.headers)

  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    headers.set(header, value)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (REDIRECT_HOSTS.has(url.hostname)) {
      url.hostname = PRIMARY_HOST
      return Response.redirect(url.toString(), 301)
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request))
  },
}
