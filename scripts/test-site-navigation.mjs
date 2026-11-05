import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

const layout = await readFile('src/layouts/BrandedPageDocument.astro', 'utf8')
assert.equal(
  (layout.match(/<EditorialHeader\s*\/>/g) ?? []).length,
  1,
  'The shared layout owns one header',
)
for (const page of ['index', 'about', 'stories']) {
  const source = await readFile(`src/pages/${page}.astro`, 'utf8')
  assert.ok(
    !source.includes('<EditorialHeader') &&
      !source.includes('<LandingNavigation'),
    `${page} must use layout navigation`,
  )
}

const header = await readFile('src/components/EditorialHeader.astro', 'utf8')
const script = stripTypeScriptTypes(
  header.match(/<script>([\s\S]*?)<\/script>/)[1],
)
const setup = ({ mobile = true, reduced = false } = {}) => {
  const handlers = new Map()
  const media = []
  let focused = false
  const element = {
    dataset: {},
    offsetHeight: 96,
    contains: () => focused,
    addEventListener: (event, callback) => handlers.set(event, callback),
  }
  const window = {
    scrollY: 0,
    matchMedia: (query) => {
      const result = {
        matches: query.includes('reduced-motion') ? reduced : mobile,
        addEventListener: (_, callback) => {
          result.change = callback
        },
      }
      media.push(result)
      return result
    },
    addEventListener: (event, callback) => handlers.set(event, callback),
    requestAnimationFrame: (callback) => {
      callback()
      return 1
    },
  }
  vm.runInNewContext(script, {
    window,
    document: {
      querySelector: () => element,
      activeElement: null,
      documentElement: { style: { setProperty() {} } },
    },
    ResizeObserver: class {
      observe() {}
    },
  })
  return {
    element,
    media,
    scroll(y) {
      window.scrollY = y
      handlers.get('scroll')()
    },
    focus() {
      focused = true
      handlers.get('focusin')()
    },
  }
}

const mobile = setup()
mobile.scroll(200)
assert.equal(
  mobile.element.dataset.hidden,
  'true',
  'Mobile hides after deliberate downward scroll',
)
mobile.scroll(196)
assert.equal(
  mobile.element.dataset.hidden,
  'true',
  'Small scroll jitter does not toggle the header',
)
mobile.scroll(180)
assert.equal(
  mobile.element.dataset.hidden,
  'false',
  'Upward scrolling restores navigation',
)
mobile.scroll(320)
mobile.focus()
assert.equal(
  mobile.element.dataset.hidden,
  'false',
  'Keyboard focus restores hidden links',
)
mobile.scroll(500)
assert.equal(
  mobile.element.dataset.hidden,
  'false',
  'Focused navigation stays visible',
)
for (const options of [{ mobile: false }, { reduced: true }]) {
  const stable = setup(options)
  stable.scroll(300)
  assert.equal(
    stable.element.dataset.hidden,
    'false',
    'Desktop and reduced-motion navigation stay visible',
  )
}
const top = setup()
top.scroll(300)
top.scroll(-20)
assert.equal(
  top.element.dataset.hidden,
  'false',
  'Top overscroll restores navigation',
)
const resize = setup()
resize.scroll(300)
resize.media.find((media) => media.matches).matches = false
resize.media[0].change()
assert.equal(
  resize.element.dataset.hidden,
  'false',
  'Switching to desktop restores navigation',
)
console.log(
  'Shared navigation ownership, scroll direction, jitter, focus, reduced motion and resize pass.',
)
