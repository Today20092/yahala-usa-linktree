import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/components/VisitedPlacesLeafletMap.tsx', import.meta.url),
  'utf8',
)
const explorerSource = await readFile(
  new URL('../src/components/VisitedPlacesExplorer.tsx', import.meta.url),
  'utf8',
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
  "new CustomEvent('visited-state-select'",
]) {
  if (!source.includes(expected)) {
    throw new Error(`Visited map is missing: ${expected}`)
  }
}

for (const expected of [
  'aria-label={`Open ${video.title ??',
  'grid-cols-[minmax(8rem,42%)_minmax(0,1fr)]',
  'dir="auto"',
  'shrink-0 border-b',
  'shrink-0 border-t',
]) {
  if (!explorerSource.includes(expected)) {
    throw new Error(`Visited drawer is missing: ${expected}`)
  }
}

if (explorerSource.includes('line-clamp-2')) {
  throw new Error('Visited drawer titles must not be clamped to two lines')
}

console.log('Visited map and mobile drawer checks pass.')
