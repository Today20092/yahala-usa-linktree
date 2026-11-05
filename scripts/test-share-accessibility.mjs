import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile('src/pages/index.astro', 'utf8')
const script = source.match(
  /<script>\s*(;\(\(\) => \{\s*const shareButton[\s\S]*?)<\/script>/,
)?.[1]
assert.ok(script, 'Share script exists')
assert.match(source, /data-share-status role="status" aria-atomic="true"/)

const setup = (navigator) => {
  let click
  const attributes = new Map()
  const status = { textContent: '' }
  const button = {
    dataset: {
      shareTitle: 'Ya Hala',
      shareText: 'Stories',
      shareUrl: 'https://example.test/',
    },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    addEventListener: (_, handler) => {
      click = handler
    },
  }
  vm.runInNewContext(script, {
    navigator,
    document: {
      querySelector: (selector) =>
        selector === '[data-share-page]' ? button : status,
    },
  })
  return { click, status, attributes }
}

let release
let copies = 0
const pending = setup({
  clipboard: {
    writeText: () => {
      copies++
      return new Promise((resolve) => {
        release = resolve
      })
    },
  },
})
const first = pending.click()
await pending.click()
assert.equal(copies, 1, 'Repeated activation must not start another copy')
assert.equal(pending.attributes.get('aria-disabled'), 'true')
release()
await first
assert.match(pending.status.textContent, /Share text copied/)
assert.equal(pending.attributes.has('aria-disabled'), false)

for (const navigator of [
  {},
  {
    clipboard: {
      writeText: async () => {
        throw new Error('Denied')
      },
    },
  },
]) {
  const failed = setup(navigator)
  await failed.click()
  assert.match(
    failed.status.textContent,
    /Unable to share automatically.*https:\/\/example.test\//,
  )
}
const canceled = setup({
  share: async () => {
    throw { name: 'AbortError' }
  },
})
await canceled.click()
assert.equal(canceled.status.textContent, 'Sharing canceled.')
const shared = setup({ share: async () => {} })
await shared.click()
assert.equal(shared.status.textContent, 'Share completed.')
console.log(
  'Share accessibility behavior passed: success, cancellation, failure, duplicate activation.',
)
