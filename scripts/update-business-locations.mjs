import { readFile, writeFile } from 'node:fs/promises'
import {
  extractBusinessAddresses,
  isPreciseAddressMatch,
} from './business-location-utils.mjs'

const data = new URL('../src/data/', import.meta.url)
const videos = JSON.parse(
  await readFile(new URL('youtube-videos.json', data), 'utf8'),
)
const cachePath = new URL('business-geocodes.json', data)
let cache = {}
try {
  cache = JSON.parse(await readFile(cachePath, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const locations = {}
let ambiguous = 0
let unmatched = 0
// One-time backfills allow 1 request/second; recurring updates use 4/minute.
// https://operations.osmfoundation.org/policies/nominatim/
const delay = process.argv.includes('--one-time') ? 1100 : 15000
for (const [id, video] of Object.entries(videos)) {
  if (
    video.isShort !== false ||
    (video.width && video.height && video.width <= video.height)
  )
    continue
  const candidates = extractBusinessAddresses(video.description)
  if (candidates.length !== 1) {
    if (candidates.length > 1) ambiguous++
    continue
  }
  const candidate = candidates[0]
  if (!Object.hasOwn(cache, candidate.address)) {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.search = new URLSearchParams({
      q: candidate.address,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'us',
      limit: '1',
    }).toString()
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YaHalaBusinessLocations/1.0 (https://yahalausa.net)',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok)
      throw new Error(
        `Geocoding stopped: HTTP ${response.status}; cached progress is preserved.`,
      )
    cache[candidate.address] = (await response.json())[0] ?? null
    await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`)
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  const result = cache[candidate.address]
  if (!isPreciseAddressMatch(candidate, result)) {
    unmatched++
    continue
  }
  locations[id] = {
    name: candidate.name,
    address: candidate.address,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  }
}
await writeFile(
  new URL('business-locations.json', data),
  `${JSON.stringify(locations, null, 2)}\n`,
)
console.log(
  `Business locations: ${Object.keys(locations).length} stories; ${ambiguous} multi-address descriptions and ${unmatched} unmatched addresses retain city fallbacks.`,
)
