import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/components/VisitedPlacesLeafletMap.tsx', import.meta.url),
  'utf8',
)
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
  "tileLayer.on('load'",
  "tileLayer.on('tileerror'",
  'if (isMounted && !hasTileError)',
  'The map is unavailable right now.',
  "Map tiles couldn't load.",
  'Browse the states below',
  'keyboard: true',
  "window.matchMedia('(pointer: coarse)').matches",
  'aspect-[2/1]',
  'window.location.assign(storyBrowserHref(place.state, place.city))',
]) {
  if (!source.includes(expected)) {
    throw new Error(`Visited map is missing: ${expected}`)
  }
}

for (const expected of [
  'window.location.assign(storyBrowserHref(state))',
  'href="/stories"',
  'Browse stories by state',
]) {
  if (!explorerSource.includes(expected)) {
    throw new Error(`Visited story entry point is missing: ${expected}`)
  }
}

for (const expected of [
  "const PAGE_SIZE = 24",
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
  'aria-label={`Open ${story.title ??',
  'dir="auto"',
  'whitespace-normal text-start',
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

if (!storyBuilderSource.includes(
  '!youtubeVideosById[story.videoId]?.isShort',
)) {
  throw new Error('Story Browser must exclude YouTube Shorts')
}

if (youtubeVideos['7lPoSEkcd18']?.isShort !== true) {
  throw new Error('Known portrait Short 7lPoSEkcd18 must be excluded')
}

console.log('Visited map and Story Browser checks pass.')
