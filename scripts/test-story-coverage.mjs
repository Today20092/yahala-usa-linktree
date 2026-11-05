import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile(
  new URL('../src/lib/story-coverage.ts', import.meta.url),
  'utf8',
)
const { buildStoryCoverage } = await import(
  `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`
)

assert.deepEqual(buildStoryCoverage([]), [])
const story = (state, videoId) => ({ state, videoId })
assert.deepEqual(
  buildStoryCoverage([
    story('Texas', 'one'),
    story('Texas', 'one'),
    story('Texas', 'two'),
    story('New York', 'three'),
    story('Alabama', 'four'),
    story('', 'unassigned'),
    story('Texas', ''),
  ]),
  [
    { name: 'Texas', value: 2, href: '/stories?state=Texas' },
    { name: 'Alabama', value: 1, href: '/stories?state=Alabama' },
    { name: 'New York', value: 1, href: '/stories?state=New+York' },
  ],
)
console.log(
  'Story coverage deduplication, ranking, empty data and URL checks pass.',
)
