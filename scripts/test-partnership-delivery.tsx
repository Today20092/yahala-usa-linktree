import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import PartnershipForm from '../src/components/PartnershipForm'
import { validatePartnership } from '../src/lib/partnership'
import { createPartnership } from '../src/worker/partnership.js'

const valid = {
  interest: 'Sponsor a video',
  name: ' Sam Partner ',
  email: 'sam@example.test',
  business: '',
  location: 'Tampa, FL',
  message: 'Line one\nLine two',
}

// Validation
const ok = validatePartnership(valid)
assert.ok(ok.ok && ok.value.name === 'Sam Partner', 'values are trimmed')
const bad = validatePartnership({
  interest: 'Something else',
  name: '',
  email: 'not-an-email',
  message: 'x'.repeat(1201),
  location: 'y'.repeat(101),
})
assert.ok(!bad.ok)
if (!bad.ok)
  assert.deepEqual(Object.keys(bad.errors).sort(), [
    'email',
    'interest',
    'location',
    'message',
    'name',
  ])
const injected = validatePartnership({ ...valid, name: 'Sam\r\nBcc: x@y.test' })
assert.ok(injected.ok && !/[\r\n]/.test(injected.value.name))
assert.ok(!validatePartnership(null).ok, 'non-object input is rejected')

// Worker route
const siteverify: { calls: number; result: unknown; fail: boolean } = {
  calls: 0,
  result: { success: true, hostname: 'example.test' },
  fail: false,
}
globalThis.fetch = (async () => {
  siteverify.calls++
  if (siteverify.fail) throw new Error('network')
  return Response.json(siteverify.result)
}) as typeof fetch

const sent: Record<string, unknown>[] = []
const makeEnv = (overrides = {}) => ({
  EMAIL: {
    send: async (message: Record<string, unknown>) => {
      sent.push(message)
      return { messageId: '1' }
    },
  },
  TURNSTILE_SECRET: 'test-secret',
  ...overrides,
})
const to = 'inbox@example.test'
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://example.test/api/partnership', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
const run = (request: Request, env = makeEnv(), dest = to) =>
  createPartnership(env, { to: dest }).submit(request)
const reset = () => {
  sent.length = 0
  siteverify.calls = 0
  siteverify.fail = false
  siteverify.result = { success: true, hostname: 'example.test' }
}

// Missing binding, secret or inbox: signal the client to fall back to mailto.
for (const [label, response] of [
  ['binding', await run(post({}), makeEnv({ EMAIL: undefined }))],
  ['secret', await run(post({}), makeEnv({ TURNSTILE_SECRET: undefined }))],
  ['inbox', await run(post({}), makeEnv(), '')],
] as const) {
  assert.equal(response.status, 503, `missing ${label} must report unavailable`)
  assert.equal((await response.json()).code, 'unavailable')
}
assert.equal(sent.length, 0)

assert.equal(
  (await run(new Request('https://example.test/api/partnership'))).status,
  405,
)
assert.equal(
  (await run(post(valid, { Origin: 'https://evil.test' }))).status,
  403,
  'cross-site posts are refused',
)
assert.equal(
  (await run(post(valid, { 'Content-Type': 'text/plain' }))).status,
  415,
)
assert.equal((await run(post('{not json'))).status, 400)
assert.equal(
  (await run(post({ ...valid, message: 'x'.repeat(9000) }))).status,
  413,
)

// Honeypot: reported as success, nothing verified or sent.
reset()
const trapped = await run(post({ ...valid, hp_field: 'http://spam.test' }))
assert.equal(trapped.status, 200)
assert.equal(sent.length, 0, 'honeypot submissions are never delivered')
assert.equal(siteverify.calls, 0)

// Invalid input never reaches Turnstile or email.
const invalid = await run(
  post({ ...valid, email: 'nope', turnstileToken: 't' }),
)
assert.equal(invalid.status, 400)
assert.ok((await invalid.json()).errors.email)
assert.equal(siteverify.calls + sent.length, 0)

// Turnstile failures
assert.equal((await run(post(valid))).status, 403, 'token is required')
siteverify.result = {
  success: false,
  'error-codes': ['invalid-input-response'],
}
assert.equal((await run(post({ ...valid, turnstileToken: 't' }))).status, 403)
siteverify.result = { success: true, hostname: 'other.test' }
assert.equal(
  (await run(post({ ...valid, turnstileToken: 't' }))).status,
  403,
  'token issued for another hostname is refused',
)
siteverify.fail = true
assert.equal((await run(post({ ...valid, turnstileToken: 't' }))).status, 502)
assert.equal(sent.length, 0)

// Success: destination comes from config, never from the request.
reset()
const delivered = await run(
  post({ ...valid, turnstileToken: 't', to: 'attacker@example.test' }),
)
assert.equal(delivered.status, 200)
assert.equal(sent.length, 1)
assert.equal(sent[0].to, to)
assert.equal(sent[0].replyTo, 'sam@example.test')
assert.equal(sent[0].subject, 'Ya Hala — Sponsor a video')
assert.match(String(sent[0].text), /Business \/ organization: Not provided/)

// Delivery provider failure surfaces as an error, not as success.
const failing = makeEnv({
  EMAIL: {
    send: async () => {
      throw Object.assign(new Error('visitor details'), {
        code: 'E_SENDER_NOT_VERIFIED',
      })
    },
  },
})
const originalError = console.error
const logged: unknown[][] = []
console.error = (...args) => logged.push(args)
reset()
const failed = await run(post({ ...valid, turnstileToken: 't' }), failing)
console.error = originalError
assert.equal(failed.status, 502)
assert.ok(
  !JSON.stringify(logged).includes('visitor details'),
  'Submitted details and error messages are not logged',
)

// Client markup and configuration
const sendMode = renderToStaticMarkup(
  <PartnershipForm email={to} turnstileSiteKey="site-key" />,
)
assert.match(sendMode, /Send my inquiry/)
assert.match(sendMode, /used only to reply to you/)
assert.match(sendMode, /role="alert"/)
assert.match(sendMode, /role="status"/)
assert.match(sendMode, /<div aria-hidden="true" class="partnership-hp">/)
const trap = sendMode.match(/<input\b[^>]*name="hp_field"[^>]*>/)?.[0]
assert.ok(trap?.includes('tabindex="-1"'), 'honeypot is skipped by keyboard')
const draftMode = renderToStaticMarkup(<PartnershipForm email={to} />)
assert.match(
  draftMode,
  /Prepare my inquiry/,
  'no site key keeps the mailto flow',
)
assert.doesNotMatch(draftMode, /Send my inquiry/)
const siteYaml = readFileSync('src/data/site.yaml', 'utf8')
assert.match(siteYaml, /turnstileSiteKey:/)
for (const file of ['wrangler.jsonc', 'wrangler.preview.jsonc'])
  assert.match(
    readFileSync(file, 'utf8'),
    /"send_email":\s*\[\{\s*"name":\s*"EMAIL"/,
    `${file} declares the EMAIL binding`,
  )
assert.match(
  readFileSync('src/worker.js', 'utf8'),
  /pathname === partnershipPath/,
)
console.log('Partnership delivery validation, honeypot, and fallback passed.')
