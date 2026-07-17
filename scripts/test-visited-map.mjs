import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/components/VisitedPlacesLeafletMap.tsx', import.meta.url),
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

console.log('Visited map loading and failure states are present.')
