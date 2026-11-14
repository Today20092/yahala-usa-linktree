import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { createTestimonials } from '../src/worker/testimonials.js'

const db = new DatabaseSync(':memory:')
db.exec(
  readFileSync(
    new URL('../migrations/0001_testimonials.sql', import.meta.url),
    'utf8',
  ),
)
const messages = []
const env = {
  TURNSTILE_SECRET: 'test-only',
  EMAIL: {
    async send(message) {
      messages.push(message)
    },
  },
  TESTIMONIALS_DB: {
    prepare(sql) {
      let params = []
      return {
        bind(...values) {
          params = values
          return this
        },
        async run() {
          return {
            meta: { changes: Number(db.prepare(sql).run(...params).changes) },
          }
        },
        async first() {
          return db.prepare(sql).get(...params) ?? null
        },
        async all() {
          return { results: db.prepare(sql).all(...params) }
        },
      }
    },
  },
}
const handler = createTestimonials(env, { to: 'review@example.com' })
const origin = 'https://test.example'
const payload = {
  name: 'عميل ياهلا',
  role: 'Client',
  quote: 'Working with Ya Hala was a wonderful experience.',
  rating: 5,
  consent: true,
  turnstileToken: 'test-token',
}
const request = (path, value, extra = {}) =>
  new Request(origin + path, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(value),
  })
const list = async () =>
  (await (await handler(new Request(origin + '/api/testimonials'))).json())
    .testimonials
const credentials = () => {
  const match = messages
    .at(-1)
    .text.match(/#([a-f0-9-]{36})\.([a-f0-9]{64})\.approved/)
  assert.ok(match)
  return { id: match[1], token: match[2] }
}
const realFetch = globalThis.fetch
let verification = {
  success: true,
  hostname: 'test.example',
  action: 'testimonial',
}
globalThis.fetch = async () => Response.json(verification)
try {
  assert.equal(
    (await handler(request('/api/testimonials', payload))).status,
    201,
  )
  assert.equal(messages[0].to, 'review@example.com')
  assert.deepEqual(await list(), [])
  const first = credentials()
  const stored = db.prepare('SELECT * FROM testimonials').get()
  assert.notEqual(stored.review_hash, first.token)
  assert.ok(stored.consent_at)
  assert.equal(
    (await handler(new Request(origin + '/api/testimonials/review'))).status,
    405,
  )
  assert.equal(
    (
      await handler(
        request('/api/testimonials/review', { ...first, action: 'preview' }),
      )
    ).status,
    200,
  )
  assert.deepEqual(await list(), [], 'preview must not approve')
  assert.equal(
    (
      await handler(
        request('/api/testimonials/review', {
          ...first,
          token: 'f'.repeat(64),
          action: 'approved',
        }),
      )
    ).status,
    410,
  )
  assert.equal(
    (
      await handler(
        request('/api/testimonials/review', { ...first, action: 'approved' }),
      )
    ).status,
    200,
  )
  const approved = await list()
  assert.equal(approved.length, 1)
  assert.equal(approved[0].name, payload.name)
  assert.deepEqual(Object.keys(approved[0]).sort(), [
    'id',
    'name',
    'quote',
    'rating',
    'role',
  ])
  assert.equal(
    (
      await handler(
        request('/api/testimonials/review', { ...first, action: 'rejected' }),
      )
    ).status,
    410,
    'token is single-use',
  )

  assert.equal(
    (await handler(request('/api/testimonials', payload))).status,
    201,
  )
  const second = credentials()
  assert.equal(
    (
      await handler(
        request('/api/testimonials/review', { ...second, action: 'rejected' }),
      )
    ).status,
    200,
  )
  assert.equal((await list()).length, 1, 'rejected quotes are private')
  await handler(request('/api/testimonials', payload))
  const expired = credentials()
  db.prepare('UPDATE testimonials SET review_expires = 0 WHERE id = ?').run(
    expired.id,
  )
  assert.equal(
    (
      await handler(
        request('/api/testimonials/review', { ...expired, action: 'approved' }),
      )
    ).status,
    410,
  )
  assert.equal(
    (
      await handler(
        request('/api/testimonials', payload, {
          Origin: 'https://other.example',
        }),
      )
    ).status,
    403,
  )
  for (const invalid of [
    { consent: false },
    { rating: 6 },
    { rating: '5' },
    { quote: 'short' },
    { name: 'x'.repeat(101) },
    { role: 'line\nbreak' },
  ]) {
    assert.equal(
      (await handler(request('/api/testimonials', { ...payload, ...invalid })))
        .status,
      400,
    )
  }
  assert.equal(
    (
      await handler(
        request('/api/testimonials', { ...payload, quote: 'x'.repeat(15000) }),
      )
    ).status,
    400,
  )
  const beforeBot = messages.length
  assert.equal(
    (
      await handler(
        request('/api/testimonials', { ...payload, hp_field: 'spam' }),
      )
    ).status,
    200,
  )
  assert.equal(messages.length, beforeBot)
  verification = {
    success: true,
    hostname: 'other.example',
    action: 'testimonial',
  }
  assert.equal(
    (await handler(request('/api/testimonials', payload))).status,
    403,
  )
  verification = { success: true, hostname: 'test.example', action: 'contact' }
  assert.equal(
    (await handler(request('/api/testimonials', payload))).status,
    403,
  )
  verification = {
    success: true,
    hostname: 'test.example',
    action: 'testimonial',
  }

  // Admin moderation requires a signed Cloudflare Access assertion.
  const issuer = 'https://team.example.cloudflareaccess.com'
  Object.assign(env, { ACCESS_TEAM_DOMAIN: `${issuer}/`, ACCESS_AUD: 'aud' })
  const rsa = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  const keys = await crypto.subtle.generateKey(rsa, true, ['sign', 'verify'])
  const stranger = await crypto.subtle.generateKey(rsa, true, ['sign'])
  const jwk = {
    ...(await crypto.subtle.exportKey('jwk', keys.publicKey)),
    kid: 'k1',
  }
  const b64 = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const sign = async (claims = {}, key = keys.privateKey) => {
    const body = `${b64({ alg: 'RS256', kid: 'k1' })}.${b64({
      iss: issuer,
      aud: ['aud'],
      email: 'admin@example.com',
      exp: Date.now() / 1000 + 60,
      ...claims,
    })}`
    const signature = await crypto.subtle.sign(
      rsa,
      key,
      new TextEncoder().encode(body),
    )
    return `${body}.${Buffer.from(signature).toString('base64url')}`
  }
  globalThis.fetch = async (url) =>
    Response.json(
      String(url) === `${issuer}/cdn-cgi/access/certs`
        ? { keys: [jwk] }
        : verification,
    )
  const admin = (token, body, headers = {}) =>
    handler(
      new Request(origin + '/api/admin/testimonials', {
        method: body ? 'POST' : 'GET',
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
          ...(token && { 'Cf-Access-Jwt-Assertion': token }),
          ...headers,
        },
        body: body && JSON.stringify(body),
      }),
    )
  const valid = await sign()
  const [head, claims, sig] = valid.split('.')
  for (const token of [
    '',
    await sign({ aud: ['other'] }),
    await sign({ iss: 'https://evil.example' }),
    await sign({ exp: Date.now() / 1000 - 1 }),
    await sign({}, stranger.privateKey),
    `${head}.${b64({ ...JSON.parse(Buffer.from(claims, 'base64url')), email: 'x' })}.${sig}`,
  ])
    assert.equal((await admin(token)).status, 401)
  const listed = await (await admin(valid)).json()
  assert.equal(listed.reviewer, 'admin@example.com')
  assert.equal(listed.testimonials.length, 3)
  assert.deepEqual(listed.testimonials.map((t) => t.status).sort(), [
    'approved',
    'pending',
    'rejected',
  ])
  assert.equal(
    (await admin(valid, { id: expired.id, action: 'approved' })).status,
    200,
    'admins can publish a pending quote after its email link expires',
  )
  assert.equal((await list()).length, 2)
  assert.equal(
    db
      .prepare('SELECT review_hash FROM testimonials WHERE id = ?')
      .get(expired.id).review_hash,
    null,
  )
  assert.equal(
    (await admin(valid, { id: first.id, action: 'rejected' })).status,
    200,
  )
  assert.deepEqual(
    (await list()).map((t) => t.id),
    [expired.id],
    'hidden quotes leave the site',
  )
  assert.equal(
    (await admin(valid, { id: first.id, action: 'approved' })).status,
    200,
  )
  assert.equal((await list()).length, 2, 'hidden quotes can be republished')
  assert.equal(
    (
      await admin(
        valid,
        { id: first.id, action: 'rejected' },
        { Origin: 'https://other.example' },
      )
    ).status,
    403,
  )
  assert.equal(
    (await admin(valid, { id: first.id, action: 'pending' })).status,
    400,
  )
  assert.equal(
    (await admin(valid, { id: crypto.randomUUID(), action: 'delete' })).status,
    404,
  )
  assert.equal(
    (await admin(valid, { id: second.id, action: 'delete' })).status,
    200,
  )
  assert.equal(
    db.prepare('SELECT id FROM testimonials WHERE id = ?').get(second.id),
    undefined,
  )
  delete env.ACCESS_AUD
  assert.equal((await admin(valid)).status, 401, 'missing config fails closed')

  const count = db
    .prepare('SELECT count(*) AS count FROM testimonials')
    .get().count
  env.EMAIL.send = async () => {
    throw { code: 'test-delivery-failure' }
  }
  assert.equal(
    (await handler(request('/api/testimonials', payload))).status,
    502,
  )
  assert.equal(
    db.prepare('SELECT count(*) AS count FROM testimonials').get().count,
    count,
  )
  assert.equal(
    (
      await createTestimonials(
        {},
        { to: '' },
      )(new Request(origin + '/api/testimonials'))
    ).status,
    503,
  )
  console.log(
    'Testimonial submission, privacy, email approval, rejection, expiry, replay, Access-gated admin moderation, validation and failure checks passed.',
  )
} finally {
  globalThis.fetch = realFetch
  db.close()
}
