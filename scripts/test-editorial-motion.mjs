import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'

const source = await readFile('src/components/EditorialMotion.astro', 'utf8')
const script = stripTypeScriptTypes(
  source.match(/<script>([\s\S]*?)<\/script>/)[1],
)
function setup(reducedMotion, supported = true) {
  const classes = new Set()
  const element = { classList: { add: (name) => classes.add(name) } }
  const observed = []
  const unobserved = []
  let callback
  class Observer {
    constructor(handler) {
      callback = handler
    }
    observe(target) {
      observed.push(target)
    }
    unobserve(target) {
      unobserved.push(target)
    }
  }
  runInNewContext(script, {
    document: { querySelectorAll: () => [element] },
    matchMedia: () => ({ matches: reducedMotion }),
    window: supported ? { IntersectionObserver: Observer } : {},
    IntersectionObserver: Observer,
  })
  return { classes, element, observed, unobserved, callback }
}
for (const state of [setup(true), setup(false, false)]) {
  assert.equal(
    state.classes.size,
    0,
    'Reduced motion and unsupported browsers retain static content',
  )
  assert.equal(state.observed.length, 0)
}
const state = setup(false)
assert.ok(state.classes.has('editorial-motion-ready'))
assert.deepEqual(state.observed, [state.element])
state.callback([{ target: state.element, isIntersecting: false }])
assert.ok(!state.classes.has('editorial-visible'))
state.callback([{ target: state.element, isIntersecting: true }])
assert.ok(state.classes.has('editorial-visible'))
assert.deepEqual(state.unobserved, [state.element])
console.log(
  'Editorial reveals, once-only observation and reduced-motion fallback pass.',
)
