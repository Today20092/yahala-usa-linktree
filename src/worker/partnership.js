import {
  formatPartnershipBody,
  validatePartnership,
} from '../lib/partnership.ts'

const SENDER = 'partnerships@yahalausa.net'
const MAX_BODY_BYTES = 8 * 1024
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const json = (body, status = 200, headers = {}) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  })

const hostOf = (value) => {
  try {
    return new URL(value).host
  } catch {
    return ''
  }
}

// `to` comes from src/data/site.yaml via the Worker entry, never from the request.
export function createPartnership(env, { to }) {
  return {
    async submit(request) {
      if (request.method !== 'POST')
        return json({ ok: false, code: 'method' }, 405, { Allow: 'POST' })

      // Missing configuration is not an error the visitor can fix: the form falls back to mailto.
      if (!to || !env.EMAIL?.send || !env.TURNSTILE_SECRET)
        return json({ ok: false, code: 'unavailable' }, 503)

      const url = new URL(request.url)
      const origin = request.headers.get('Origin')
      if (origin && hostOf(origin) !== url.host)
        return json({ ok: false, code: 'forbidden' }, 403)
      if (!request.headers.get('Content-Type')?.includes('application/json'))
        return json({ ok: false, code: 'invalid' }, 415)
      if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES)
        return json({ ok: false, code: 'invalid' }, 413)

      const raw = await request.text()
      if (raw.length > MAX_BODY_BYTES)
        return json({ ok: false, code: 'invalid' }, 413)
      let payload
      try {
        payload = JSON.parse(raw)
      } catch {
        return json({ ok: false, code: 'invalid' }, 400)
      }

      // Bots fill the hidden field. Answer as if it worked so they learn nothing.
      if (typeof payload?.hp_field === 'string' && payload.hp_field !== '')
        return json({ ok: true })

      const result = validatePartnership(payload)
      if (!result.ok)
        return json({ ok: false, code: 'invalid', errors: result.errors }, 400)

      const token = payload.turnstileToken
      if (typeof token !== 'string' || !token || token.length > 2048)
        return json({ ok: false, code: 'verification' }, 403)
      try {
        const verify = await fetch(SITEVERIFY, {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: token,
            remoteip: request.headers.get('CF-Connecting-IP') ?? '',
          }),
        })
        const outcome = await verify.json()
        if (
          !outcome.success ||
          (outcome.hostname && outcome.hostname !== url.hostname)
        )
          return json({ ok: false, code: 'verification' }, 403)
      } catch {
        return json({ ok: false, code: 'failed' }, 502)
      }

      const inquiry = result.value
      try {
        await env.EMAIL.send({
          to,
          from: { email: SENDER, name: 'Ya Hala website' },
          replyTo: inquiry.email,
          subject: `Ya Hala — ${inquiry.interest}`,
          text: formatPartnershipBody(inquiry),
        })
      } catch (error) {
        // Log the error code only: the message may contain the visitor's details.
        console.error('partnership send failed', error?.code ?? 'unknown')
        return json({ ok: false, code: 'failed' }, 502)
      }
      return json({ ok: true })
    },
  }
}
