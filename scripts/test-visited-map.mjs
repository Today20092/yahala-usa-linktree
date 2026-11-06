import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { stripTypeScriptTypes } from 'node:module'

const wrapperSource = await readFile(
  new URL('../src/components/StoryMapShell.tsx', import.meta.url),
  'utf8',
)
const mapSource = await readFile(
  new URL('../src/components/StoryMap.tsx', import.meta.url),
  'utf8',
)
const uiMapSource = await readFile(
  new URL('../src/components/ui/map.tsx', import.meta.url),
  'utf8',
)
const source = wrapperSource + mapSource + uiMapSource
const explorerSource = await readFile(
  new URL('../src/components/VisitedPlacesExplorer.tsx', import.meta.url),
  'utf8',
)
const browserSource = await readFile(
  new URL('../src/components/StoryBrowser.tsx', import.meta.url),
  'utf8',
)
const pageSource = await readFile(
  new URL('../src/pages/stories.astro', import.meta.url),
  'utf8',
)
const storyBuilderSource = await readFile(
  new URL('../src/lib/story-browser.ts', import.meta.url),
  'utf8',
)
const youtubeVideos = JSON.parse(
  await readFile(
    new URL('../src/data/youtube-videos.json', import.meta.url),
    'utf8',
  ),
)

for (const expected of [
  "React.useState<'loading' | 'ready' | 'error'>",
  "map.on('load', ready)",
  "map.on('error', failed)",
  'The map is unavailable right now.',
  "Map tiles couldn't load.",
  'Use the location filters',
  '<MarkerContent>',
  'cooperativeGestures={!props.expanded}',
  'map.touchZoomRotate.disableRotation()',
  'touchPitch={false}',
  'aspect-[2/1]',
  'href={storyBrowserHref(selected.state, selected.city)}',
  'getClusterExpansionZoom',
  'MapControls',
  'maxZoom={18}',
]) {
  if (!source.includes(expected)) {
    throw new Error(`Visited map is missing: ${expected}`)
  }
}

for (const expected of [
  'href={storyBrowserHref(selectedState)}',
  'onValueChange={setSelectedState}',
  'Browse stories in {selectedState}',
  'href="/stories"',
  'Browse stories by state',
]) {
  if (!explorerSource.includes(expected)) {
    throw new Error(`Visited story entry point is missing: ${expected}`)
  }
}

assert.ok(
  !explorerSource.includes('window.location.assign'),
  'Selecting a state must not unexpectedly navigate',
)
assert.ok(
  !source.includes('event.ctrlKey'),
  'Map must preserve native browser Ctrl+wheel zoom',
)
assert.ok(
  source.includes("inert={status === 'error'}"),
  'Failed map controls must leave keyboard navigation',
)
assert.ok(
  source.includes('locations. Zoom in'),
  'Clusters must announce location counts',
)
assert.ok(
  browserSource.includes('Showing {Math.min(visibleCount, matches.length)} of'),
  'Pagination must announce visible and total counts',
)
assert.ok(
  browserSource.includes('firstAddedStory.current?.focus()'),
  'Pagination must move focus to new stories',
)

for (const expected of [
  'const PAGE_SIZE = 24',
  "const UNASSIGNED_FILTER = 'unassigned'",
  "window.addEventListener('popstate', sync)",
  "history.pushState(null, '', `/stories",
  "params.get('sort') === 'oldest'",
  'Sort by date',
  'Newest first',
  'Oldest first',
  'Location not yet assigned',
  'setVisibleCount(PAGE_SIZE)',
  'visibleCount < matches.length',
  'No stories match these filters.',
  'Open on YouTube',
  'dir="auto"',
  'whitespace-normal',
  'text-start',
  '[overflow-wrap:anywhere]',
  '{isNew && <Badge>New</Badge>}',
  'event.currentTarget.src = fallback',
]) {
  if (!browserSource.includes(expected)) {
    throw new Error(`Story Browser is missing: ${expected}`)
  }
}

if (!pageSource.includes('canonical={canonicalUrl}')) {
  throw new Error('Story Browser must declare /stories as canonical')
}

if (!storyBuilderSource.includes('video.isShort === false')) {
  throw new Error('Story Browser must exclude YouTube Shorts')
}

if (youtubeVideos['7lPoSEkcd18']?.isShort !== true) {
  throw new Error('Known portrait Short 7lPoSEkcd18 must be excluded')
}

const catalog = {
  landscape: {
    videoId: 'landscape',
    isShort: false,
    width: 1920,
    height: 1080,
  },
  short: { videoId: 'short', isShort: true },
  portrait: { videoId: 'portrait', isShort: false, width: 1080, height: 1920 },
  square: { videoId: 'square', isShort: false, width: 1080, height: 1080 },
  unknown: { videoId: 'unknown' },
  regular: { videoId: 'regular', isShort: false },
}
const testSource = stripTypeScriptTypes(storyBuilderSource)
  .replace(
    "'./video-recency.js'",
    JSON.stringify(
      new URL('../src/lib/video-recency.js', import.meta.url).href,
    ),
  )
  .replace(
    "import { youtubeVideosById } from './youtube-videos'",
    `const youtubeVideosById = ${JSON.stringify(catalog)}`,
  )
  .replace(
    "import businessLocations from '../data/business-locations.json'",
    'const businessLocations = {}',
  )
const { buildStories } = await import(
  `data:text/javascript;base64,${Buffer.from(testSource).toString('base64')}`
)
const places = {
  stateGroups: [
    {
      state: 'Texas',
      abbreviation: 'TX',
      stateVideos: [
        { videoId: 'short' },
        { videoId: 'portrait' },
        { videoId: 'missing' },
      ],
      places: [{ city: 'Austin', videos: [{ videoId: 'landscape' }] }],
    },
  ],
}
assert.deepEqual(
  buildStories(places)
    .map((video) => video.videoId)
    .sort(),
  ['landscape', 'regular'],
)
assert.deepEqual(
  buildStories({})
    .map((video) => video.videoId)
    .sort(),
  ['landscape', 'regular'],
)
for (const id of ['vDtTkpHzg18', 'WFRFSj-kioo', 'rrdjvuYfXFc', 'jdM-uQmte7g']) {
  assert.equal(
    youtubeVideos[id]?.isShort,
    true,
    `Known Short ${id} must stay excluded`,
  )
}

console.log('Visited map and Story Browser checks pass.')
