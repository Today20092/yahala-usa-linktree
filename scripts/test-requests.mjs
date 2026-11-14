import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { cleanupRequests, handleAdminRequests } from '../src/worker/requests.js'

const db = new DatabaseSync(':memory:')
db.exec(
  readFileSync(
    new URL('../migrations/0002_partnership_requests.sql', import.meta.url),
    'utf8',
  ),
)
const issuer = 'https://team.example.cloudflareaccess.com'
const env = {
  ACCESS_TEAM_DOMAIN: issuer,
  ACCESS_AUD: 'aud',
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
        async all() {
          return { results: db.prepare(sql).all(...params) }
        },
      }
    },
  },
}

const rsa = {
  name: 'RSASSA-PKCS1-v1_5',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
}
const keys = await crypto.subtle.generateKey(rsa, true, ['sign', 'verify'])
const jwk = {
  ...(await crypto.subtle.exportKey('jwk', keys.publicKey)),
  kid: 'k1',
}
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const body = `${b64({ alg: 'RS256', kid: 'k1' })}.${b64({ iss: issuer, aud: ['aud'], email: 'admin@example.com', exp: Date.now() / 1000 + 60 })}`
const token = `${body}.${Buffer.from(await crypto.subtle.sign(rsa, keys.privateKey, new TextEncoder().encode(body))).toString('base64url')}`
const realFetch = globalThis.fetch
globalThis.fetch = async () => Response.json({ keys: [jwk] })

const origin = 'https://test.example'
const admin = (payload, headers = {}) =>
  handleAdminRequests(
    new Request(origin + '/api/admin/requests', {
      method: payload ? 'POST' : 'GET',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'Cf-Access-Jwt-Assertion': token,
        ...headers,
      },
      body: payload && JSON.stringify(payload),
    }),
    env,
  )
const insert = (id, status = 'new', archivedAt = null) =>
  db
    .prepare(
      "INSERT INTO partnership_requests (id, interest, name, email, message, status, archived_at) VALUES (?, 'Sponsor a video', 'Sam', 'sam@example.test', 'Hello', ?, ?)",
    )
    .run(id, status, archivedAt)
const status = (id) =>
  db
    .prepare(
      'SELECT status, archived_at FROM partnership_requests WHERE id = ?',
    )
    .get(id)

try {
  const [a, b] = [crypto.randomUUID(), crypto.randomUUID()]
  insert(a)
  insert(b)

  assert.equal(
    (await admin(undefined, { 'Cf-Access-Jwt-Assertion': '' })).status,
    401,
    'requests need a signed Access assertion',
  )
  const listed = await (await admin()).json()
  assert.equal(listed.reviewer, 'admin@example.com')
  assert.equal(listed.requests.length, 2)
  assert.equal(listed.requests[0].email, 'sam@example.test')

  assert.equal((await admin({ id: a, action: 'replied' })).status, 200)
  assert.equal(status(a).status, 'replied')
  assert.equal((await admin({ id: a, action: 'archived' })).status, 200)
  assert.ok(status(a).archived_at, 'archiving starts the retention clock')
  assert.equal((await admin({ id: a, action: 'new' })).status, 200)
  assert.equal(
    status(a).archived_at,
    null,
    'restoring stops the retention clock',
  )

  assert.equal(
    (
      await admin(
        { id: a, action: 'archived' },
        { Origin: 'https://other.example' },
      )
    ).status,
    403,
  )
  assert.equal((await admin({ id: a, action: 'approved' })).status, 400)
  assert.equal(
    (await admin({ id: crypto.randomUUID(), action: 'delete' })).status,
    404,
  )
  assert.equal((await admin({ id: b, action: 'delete' })).status, 200)
  assert.equal(status(b), undefined)

  // Retention: only archived requests older than 12 months are removed.
  const [old, recent, unarchived] = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ]
  insert(old, 'archived', '2000-01-01 00:00:00')
  insert(
    recent,
    'archived',
    new Date().toISOString().slice(0, 19).replace('T', ' '),
  )
  insert(unarchived, 'replied')
  db.prepare(
    "UPDATE partnership_requests SET created_at = '2000-01-01 00:00:00' WHERE id = ?",
  ).run(unarchived)
  await cleanupRequests(env)
  assert.equal(status(old), undefined, 'year-old archived request is deleted')
  assert.ok(status(recent), 'recently archived request is kept')
  assert.ok(status(unarchived), 'requests that were never archived are kept')
  await cleanupRequests({})

  delete env.ACCESS_AUD
  assert.equal((await admin()).status, 401, 'missing config fails closed')
  console.log(
    'Saved request admin, status changes, Access gate and 12-month retention checks passed.',
  )
} finally {
  globalThis.fetch = realFetch
  db.close()
}
