import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile('src/components/MotionToggle.astro', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1]
assert.ok(script, 'Motion controls must have an interaction script')
// Touch users get no hover pause, so the control must stay visible on phones.
assert.doesNotMatch(
  source,
  /max-width[\s\S]*?\.motion-toggle[\s\S]*?(clip-path|width:\s*1px|display:\s*none)/,
  'Motion controls must stay visible at phone widths',
)

const targets = new Map(['brands', 'stories'].map((id) => [id, new Set()]))
const buttons = ['brands', 'stories', 'missing'].map((id) => ({
  textContent: 'Pause motion',
  getAttribute: () => id,
  addEventListener(event, handler) {
    assert.equal(event, 'click')
    this.click = handler
  },
}))

runInNewContext(script, {
  document: {
    querySelectorAll: () => buttons,
    getElementById(id) {
      const attributes = targets.get(id)
      return (
        attributes && {
          hasAttribute: (name) => attributes.has(name),
          toggleAttribute: (name, force) =>
            force ? attributes.add(name) : attributes.delete(name),
        }
      )
    },
  },
})

buttons[0].click()
assert.equal(buttons[0].textContent, 'Resume motion')
assert.ok(targets.get('brands').has('data-motion-paused'))
assert.equal(
  targets.get('stories').size,
  0,
  'Pausing brands must not pause stories',
)
buttons[1].click()
buttons[0].click()
assert.equal(buttons[0].textContent, 'Pause motion')
assert.equal(targets.get('brands').size, 0)
assert.ok(targets.get('stories').has('data-motion-paused'))
assert.doesNotThrow(() => buttons[2].click())
console.log(
  'Motion controls pause and resume independently; missing targets are safe.',
)

for (const component of ['TextReveal', 'EditorialMotion']) {
  const revealSource = await readFile(
    `src/components/${component}.astro`,
    'utf8',
  )
  const revealScript = stripTypeScriptTypes(
    revealSource.match(/<script>([\s\S]*?)<\/script>/)[1],
  )
  for (const reduced of [false, true]) {
    for (const supported of [false, true]) {
      const classes = new Set()
      const element = { classList: { add: (name) => classes.add(name) } }
      let callback
      let observed = 0
      let removed = 0
      const context = {
        document: { querySelectorAll: () => [element] },
        matchMedia: () => ({ matches: reduced }),
        window: supported ? { IntersectionObserver: true } : {},
        IntersectionObserver: class {
          constructor(handler) {
            callback = handler
          }
          observe(target) {
            assert.equal(target, element)
            observed++
          }
          unobserve(target) {
            assert.equal(target, element)
            removed++
          }
        },
      }
      runInNewContext(revealScript, context)
      assert.equal(observed, !reduced && supported ? 1 : 0)
      if (callback) {
        const visible =
          component === 'TextReveal'
            ? 'text-reveal-visible'
            : 'editorial-visible'
        callback([{ target: element, isIntersecting: false }])
        assert.ok(!classes.has(visible))
        callback([{ target: element, isIntersecting: true }])
        assert.ok(classes.has(visible))
        assert.equal(removed, 1, 'Reveals stop observing after first entrance')
      } else {
        assert.equal(classes.size, 0, 'Fallback content must remain visible')
      }
    }
  }
  assert.ok(revealSource.includes('[data-motion-paused]'))
  assert.ok(revealSource.includes('prefers-reduced-motion'))
}
const textReveal = await readFile('src/components/TextReveal.astro', 'utf8')
assert.ok(textReveal.includes('<span class="sr-only">{text}</span>'))
assert.ok(textReveal.includes('<span aria-hidden="true">'))
console.log(
  'Text and scroll reveals: once-only entrances, reduced motion, unsupported-browser fallback and accessible text passed.',
)
