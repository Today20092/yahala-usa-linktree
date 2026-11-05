import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const source = (await readFile(new URL('../src/components/VideoSearch.tsx', import.meta.url), 'utf8')).replaceAll('\r\n', '\n')
const searchBody = source.match(/  const runSearch = async \(searchQuery: string\) => \{([\s\S]*?)\n  \}\n\n  const submit/)[1]
const compile = new Function('fetch', 'searchPending', 'copy', 'setLastQuery', 'setStatus', 'setResults',
  `return ${stripTypeScriptTypes(`async (searchQuery: string) => {${searchBody}\n}`)}`)
let complete
let requests = 0
let status
let results
let lastQuery
const pending = { current: false }
const run = compile(() => { requests++; return new Promise((resolve) => { complete = resolve }) }, pending,
  { resultLimit: 3 }, (value) => { lastQuery = value }, (value) => { status = value }, (value) => { results = value })
await run(' ')
assert.equal(requests, 0)
const first = run('  Austin  ')
assert.equal(status, 'loading')
await run('Chicago')
assert.equal(requests, 1, 'Repeated activation must not start a concurrent request')
complete({ ok: true, json: async () => ({ results: [{ title: 'Austin story' }] }) })
await first
assert.equal(lastQuery, 'Austin')
assert.equal(status, 'done')
assert.equal(results.length, 1)
assert.equal(pending.current, false)
const empty = run('empty')
complete({ ok: true, json: async () => ({ results: [] }) })
await empty
assert.deepEqual(results, [])
const failed = run('retained query')
complete({ ok: false })
await failed
assert.equal(status, 'error')
assert.equal(lastQuery, 'retained query')
assert.equal(pending.current, false, 'Failure must permit retry')
const retry = run('retained query')
complete({ ok: true, json: async () => ({ results: [] }) })
await retry
assert.equal(status, 'done')
for (const expected of ['<h2', '<h3', 'role="status" aria-atomic="true"', 'aria-describedby="video-search-help"', 'aria-label={`${copy.watchLabel}: ${result.title}']) {
  assert.ok(source.includes(expected), `Search accessibility seam missing: ${expected}`)
}
assert.ok(!source.includes('aria-live="polite"'), 'Result cards must not be an oversized live region')
console.log('Search duplicate activation, success, empty, error/retry and accessibility seams pass.')
