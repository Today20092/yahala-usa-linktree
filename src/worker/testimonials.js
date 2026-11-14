import { verifyAccess } from './access.js'

const MAX_BYTES = 12 * 1024
export const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
const digest = async (token) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)),
    ),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')

export async function readPayload(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json'))
    return null
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > MAX_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(await new Blob(chunks).text())
  } catch {
    return null
  }
}

export function createTestimonials(env, { to }) {
  return async (request) => {
    const url = new URL(request.url)
    if (!env.TESTIMONIALS_DB) return json({ error: 'unavailable' }, 503)
    try {
      if (url.pathname === '/api/admin/testimonials') {
        const reviewer = await verifyAccess(request, env)
        if (!reviewer) return json({ error: 'unauthorized' }, 401)
        if (request.method === 'GET') {
          const { results } = await env.TESTIMONIALS_DB.prepare(
            'SELECT id, name, role, quote, rating, status, consent_at, reviewed_at, review_expires FROM testimonials ORDER BY consent_at DESC LIMIT 500',
          ).all()
          return json({ testimonials: results, reviewer })
        }
        if (request.method !== 'POST') return json({ error: 'method' }, 405)
        if (request.headers.get('Origin') !== url.origin)
          return json({ error: 'forbidden' }, 403)
        const { id, action } = (await readPayload(request)) ?? {}
        if (
          typeof id !== 'string' ||
          !/^[a-f0-9-]{36}$/.test(id) ||
          !['approved', 'rejected', 'delete'].includes(action)
        )
          return json({ error: 'invalid' }, 400)
        // Clearing review_hash retires the emailed link once an admin decides.
        const result = await (
          action === 'delete'
            ? env.TESTIMONIALS_DB.prepare(
                'DELETE FROM testimonials WHERE id = ?',
              ).bind(id)
            : env.TESTIMONIALS_DB.prepare(
                'UPDATE testimonials SET status = ?, review_hash = NULL, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
              ).bind(action, id)
        ).run()
        if (result.meta.changes !== 1) return json({ error: 'missing' }, 404)
        console.log('testimonial admin', action, id, reviewer)
        return json({ ok: true })
      }
      if (url.pathname === '/api/testimonials' && request.method === 'GET') {
        const { results } = await env.TESTIMONIALS_DB.prepare(
          "SELECT id, name, role, quote, rating FROM testimonials WHERE status = 'approved' ORDER BY reviewed_at DESC LIMIT 60",
        ).all()
        return json({ testimonials: results })
      }
      if (request.method !== 'POST') return json({ error: 'method' }, 405)
      if (request.headers.get('Origin') !== url.origin)
        return json({ error: 'forbidden' }, 403)
      const payload = await readPayload(request)
      if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        return json({ error: 'invalid' }, 400)

      if (url.pathname === '/api/testimonials/review') {
        const { id, token, action } = payload
        if (
          typeof id !== 'string' ||
          !/^[a-f0-9-]{36}$/.test(id) ||
          typeof token !== 'string' ||
          !/^[a-f0-9]{64}$/.test(token) ||
          !['preview', 'approved', 'rejected'].includes(action)
        )
          return json({ error: 'invalid' }, 400)
        const hash = await digest(token)
        const row = await env.TESTIMONIALS_DB.prepare(
          "SELECT name, role, quote, rating FROM testimonials WHERE id = ? AND review_hash = ? AND status = 'pending' AND review_expires > ?",
        )
          .bind(id, hash, Date.now())
          .first()
        if (!row) return json({ error: 'expired' }, 410)
        if (action === 'preview') return json({ testimonial: row })
        const result = await env.TESTIMONIALS_DB.prepare(
          "UPDATE testimonials SET status = ?, review_hash = NULL, reviewed_at = CURRENT_TIMESTAMP WHERE id = ? AND review_hash = ? AND status = 'pending' AND review_expires > ?",
        )
          .bind(action, id, hash, Date.now())
          .run()
        return result.meta.changes === 1
          ? json({ ok: true })
          : json({ error: 'expired' }, 410)
      }

      if (!to || !env.EMAIL?.send || !env.TURNSTILE_SECRET)
        return json({ error: 'unavailable' }, 503)
      if (typeof payload.hp_field === 'string' && payload.hp_field)
        return json({ ok: true })
      const text = (key) =>
        typeof payload[key] === 'string' ? payload[key].trim() : ''
      const name = text('name'),
        role = text('role'),
        quote = text('quote')
      const rating = payload.rating
      if (
        !name ||
        name.length > 100 ||
        role.length > 150 ||
        quote.length < 20 ||
        quote.length > 1200 ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        payload.consent !== true ||
        /[\u0000-\u001f\u007f]/.test(name + role) ||
        typeof payload.turnstileToken !== 'string' ||
        !payload.turnstileToken ||
        payload.turnstileToken.length > 2048
      )
        return json({ error: 'invalid' }, 400)
      const verification = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: payload.turnstileToken,
            remoteip: request.headers.get('CF-Connecting-IP') ?? '',
          }),
        },
      )
      const outcome = await verification.json()
      if (
        !outcome.success ||
        outcome.hostname !== url.hostname ||
        outcome.action !== 'testimonial'
      )
        return json({ error: 'verification' }, 403)
      const id = crypto.randomUUID()
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (b) => b.toString(16).padStart(2, '0'),
      ).join('')
      await env.TESTIMONIALS_DB.prepare(
        'INSERT INTO testimonials (id, name, role, quote, rating, review_hash, review_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
        .bind(
          id,
          name,
          role,
          quote,
          rating,
          await digest(token),
          Date.now() + 14 * 86400000,
        )
        .run()
      // Fragments keep review credentials out of HTTP access logs and referrers.
      const reviewUrl = `${url.origin}/testimonial/review#${id}.${token}`
      try {
        await env.EMAIL.send({
          to,
          from: {
            email: 'partnerships@yahalausa.net',
            name: 'Ya Hala website',
          },
          subject: 'Ya Hala — testimonial awaiting approval',
          text: [
            `${name}${role ? ` — ${role}` : ''}`,
            `Rating: ${rating}/5`,
            '',
            quote,
            '',
            'This client gave permission to publish this testimonial with their name and role.',
            '',
            `Approve: ${reviewUrl}.approved`,
            `Reject: ${reviewUrl}.rejected`,
            '',
            'Links expire in 14 days and work once. Opening a link does not publish anything; confirm your choice on the page.',
          ].join('\n'),
        })
      } catch (error) {
        await env.TESTIMONIALS_DB.prepare(
          "DELETE FROM testimonials WHERE id = ? AND status = 'pending'",
        )
          .bind(id)
          .run()
        throw error
      }
      return json({ ok: true }, 201)
    } catch (error) {
      console.error('testimonial request failed', error?.code ?? 'unknown')
      return json({ error: 'failed' }, 502)
    }
  }
}
