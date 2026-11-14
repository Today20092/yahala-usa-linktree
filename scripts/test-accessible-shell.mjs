import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile('src/components/QrCodeButton.astro', 'utf8')
const script = stripTypeScriptTypes(source.match(/<script>([\s\S]*?)<\/script>/)[1])
const handlers = new Map()
const attributes = new Map()
const trigger = {
  focused: false,
  setAttribute: (key, value) => attributes.set(key, value),
  addEventListener: (key, callback) => handlers.set(key, callback),
  focus() { this.focused = true },
}
const dialogHandlers = new Map()
const closeHandlers = new Map()
let focusedClose = false
const dialog = {
  open: false,
  classList: { add() {}, remove() {} },
  matches: () => false,
  showModal() { this.open = true },
  close() { this.open = false; dialogHandlers.get('close')() },
  addEventListener: (key, callback) => dialogHandlers.set(key, callback),
}
runInNewContext(script, {
  document: {
    querySelector: (selector) => selector === '#qr-dialog' ? dialog : ({
      focus() { focusedClose = true },
      addEventListener: (key, callback) => closeHandlers.set(key, callback),
    }),
    querySelectorAll: () => [trigger],
    getElementById: () => ({
      focus() { focusedClose = true },
      addEventListener: (key, callback) => closeHandlers.set(key, callback),
    }),
    documentElement: { classList: { add() {}, remove() {} } },
  },
  HTMLElement: Object,
})
assert.equal(attributes.get('role'), 'button')
let prevented = false
handlers.get('keydown')({ key: ' ', preventDefault() { prevented = true } })
assert.ok(prevented && dialog.open && focusedClose)
closeHandlers.get('click')({ preventDefault() {} })
assert.equal(dialog.open, false)
assert.equal(trigger.focused, true)
handlers.get('click')({ preventDefault() {} })
assert.equal(dialog.open, true)

const layout = await readFile('src/layouts/BrandedPageDocument.astro', 'utf8')
assert.ok(layout.includes('href="#main-content"'))
for (const page of ['about', 'stories']) {
  assert.match(await readFile(`src/pages/${page}.astro`, 'utf8'), /<(?:main|Container\s+as="main"\s+(?:size="\w+"\s+)?)\s*id="main-content"\s+tabindex="-1"/)
}
const stories = await readFile('src/pages/stories.astro', 'utf8')
assert.ok(stories.includes('slot="fallback"') && stories.includes('siteConfig.youtubeChannels[0].videosUrl'))
const about = await readFile('src/pages/about.astro', 'utf8')
const contactCta = await readFile('src/components/ContactCta.astro', 'utf8')
assert.ok(about.includes('<ContactCta'), 'About must use the shared contact CTA')
for (const source of [about, contactCta]) {
  assert.ok(!source.includes('text-primary-foreground/80'), 'Small CTA copy must retain full foreground contrast')
}
console.log('QR keyboard activation, modal focus return, skip targets and story fallback passed.')
