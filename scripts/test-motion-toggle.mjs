import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const source = await readFile('src/components/MotionToggle.astro', 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1]
assert.ok(script, 'Motion controls must have an interaction script')

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
