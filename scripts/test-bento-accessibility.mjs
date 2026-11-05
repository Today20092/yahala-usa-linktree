import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile('src/components/VideoBentoGrid.astro', 'utf8')
const normalizedSource = source.replace(/\s+/g, ' ')
for (const selector of ['.bento-scroll-track', '.bento-scroll-group']) {
  assert.ok(normalizedSource.includes(`[data-portfolio-scroll]:is([data-motion-paused], :focus-within) ${selector}`))
}
const reduced = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'))
for (const state of [reduced, source.slice(source.indexOf('[data-portfolio-scroll]:is'))]) {
  assert.match(state, /width: 100%/)
  assert.match(state, /flex-wrap: wrap/)
  assert.match(state, /animation: none/)
  assert.match(state, /transform: none/)
  assert.match(state, /aria-hidden='true'[\s\S]*display: none/)
  assert.match(state, /max-width: 100%/)
}
assert.ok(!source.includes('aria-label={`${item.platform}'))
console.log('Bento static modes expose unique wrapping content for pause, focus and reduced motion.')
