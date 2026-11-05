import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile(
  new URL('../src/lib/story-map.ts', import.meta.url),
  'utf8',
)
const { buildStoryMapPlaces } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`
)
const place = {
  state: 'Texas',
  city: 'Austin',
  label: 'Austin, TX',
  latitude: 30.2672,
  longitude: -97.7431,
}
const stories = [
  { state: 'Texas', city: 'Austin', videoId: 'one' },
  { state: 'Texas', city: 'Austin', videoId: 'one' },
  { state: 'Texas', city: 'Austin', videoId: 'two' },
  { state: 'Texas', videoId: 'state-only' },
  { state: '', videoId: 'unassigned' },
]
assert.deepEqual(buildStoryMapPlaces([place], stories), [
  { ...place, storyCount: 2 },
])
assert.deepEqual(buildStoryMapPlaces([place], stories.slice(3)), [])
assert.deepEqual(
  buildStoryMapPlaces([{ ...place, latitude: NaN }], stories),
  [],
)
assert.deepEqual(
  buildStoryMapPlaces([{ ...place, city: 'Houston' }], stories),
  [],
)
assert.deepEqual(buildStoryMapPlaces([], stories), [])
console.log('Story map counts, coordinates and missing-location checks pass.')
