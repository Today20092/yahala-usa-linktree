const decode = (part) =>
  Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  )
const parse = (part) => JSON.parse(new TextDecoder().decode(decode(part)))

/**
 * Returns the signed-in Cloudflare Access identity, or null.
 * Access already blocks unauthenticated requests at the edge; this re-checks the
 * signed assertion so a misconfigured or missing Access app fails closed.
 */
export async function verifyAccess(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  const issuer = String(env.ACCESS_TEAM_DOMAIN ?? '').replace(/\/+$/, '')
  if (!token || !issuer.startsWith('https://') || !env.ACCESS_AUD) return null
  const [header, payload, signature, extra] = token.split('.')
  if (!signature || extra !== undefined) return null
  try {
    const { alg, kid } = parse(header)
    const claims = parse(payload)
    if (alg !== 'RS256' || !kid) return null
    // shortcut: fetches the signing keys on each admin request; cache them if admin traffic grows.
    const certs = await fetch(`${issuer}/cdn-cgi/access/certs`, {
      signal: AbortSignal.timeout(5000),
    })
    const jwk = (await certs.json()).keys?.find((key) => key.kid === kid)
    if (!jwk) return null
    const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    const key = await crypto.subtle.importKey('jwk', jwk, algorithm, false, [
      'verify',
    ])
    const valid = await crypto.subtle.verify(
      algorithm,
      key,
      decode(signature),
      new TextEncoder().encode(`${header}.${payload}`),
    )
    const now = Date.now() / 1000
    if (
      !valid ||
      claims.iss !== issuer ||
      ![claims.aud].flat().includes(env.ACCESS_AUD) ||
      !(claims.exp > now) ||
      (claims.nbf && claims.nbf > now + 60)
    )
      return null
    return String(claims.email || claims.common_name || 'service token')
  } catch {
    return null
  }
}
