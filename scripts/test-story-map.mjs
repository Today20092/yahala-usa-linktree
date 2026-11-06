import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import {
  extractBusinessAddresses,
  isPreciseAddressMatch,
} from './business-location-utils.mjs'

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
  {
    ...place,
    id: 'city:Texas:Austin',
    kind: 'city',
    address: undefined,
    storyCount: 2,
    stories: [stories[0], stories[2]],
  },
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

const businessLocation = {
  name: 'Test Cafe',
  address: '123 Main St, Austin, TX 78701',
  latitude: 30.27,
  longitude: -97.74,
}
const located = { ...stories[0], businessLocation }
const pins = buildStoryMapPlaces([place], [located, located, stories[2]])
assert.equal(pins.length, 2)
assert.equal(pins[0].kind, 'business')
assert.equal(pins[0].storyCount, 1)
assert.equal(pins[0].latitude, businessLocation.latitude)
assert.equal(pins[1].kind, 'city')
assert.equal(
  pins[1].storyCount,
  1,
  'Precise stories must not also inflate city pins',
)
assert.equal(
  buildStoryMapPlaces([], [located]).length,
  1,
  'Business coordinates work without city coordinates',
)
assert.equal(
  buildStoryMapPlaces([], [{ ...located, state: '', city: undefined }]).length,
  1,
  'Unassigned stories can have business pins',
)
assert.equal(
  buildStoryMapPlaces(
    [place],
    [{ ...located, businessLocation: { ...businessLocation, latitude: 91 } }],
  )[0].kind,
  'city',
)
assert.equal(
  buildStoryMapPlaces(
    [],
    [
      {
        ...located,
        businessLocation: { ...businessLocation, longitude: Infinity },
      },
    ],
  ).length,
  0,
)
assert.equal(
  buildStoryMapPlaces(
    [place],
    [located, { ...stories[2], businessLocation }],
  )[0].storyCount,
  2,
)
assert.equal(stories.length, 5, 'Mapping must not remove list stories')

const [candidate] = extractBusinessAddresses(
  'Test Cafe\n📍 Address: 123 Main St, Austin, TX 78701\nPhone: 1234567890',
)
assert.equal(candidate.name, 'Test Cafe')
assert.equal(candidate.address, businessLocation.address)
assert.deepEqual(
  extractBusinessAddresses(
    'I have worked in Texas for 20 years.\nPhone: 555-123-4567\nAustin, TX 78701',
  ),
  [],
)
assert.equal(
  extractBusinessAddresses(
    '123 Main St, Austin, TX 78701\n456 Other Rd, Dallas, TX 75001',
  ).length,
  2,
)
const result = {
  lat: '30.27',
  lon: '-97.74',
  address: {
    country_code: 'us',
    house_number: '123',
    road: 'Main Street',
    postcode: '78701',
  },
}
assert.equal(isPreciseAddressMatch(candidate, result), true)
assert.equal(
  isPreciseAddressMatch(candidate, {
    ...result,
    address: { ...result.address, house_number: undefined },
  }),
  false,
)
assert.equal(
  isPreciseAddressMatch(candidate, {
    ...result,
    address: { ...result.address, postcode: '75001' },
  }),
  false,
)
assert.equal(
  isPreciseAddressMatch(candidate, {
    ...result,
    address: { ...result.address, road: 'Other Street' },
  }),
  false,
)
assert.equal(isPreciseAddressMatch(candidate, { ...result, lat: null }), false)
assert.equal(isPreciseAddressMatch(candidate, null), false)
console.log(
  'Business address extraction, precision, grouping and city fallbacks pass.',
)

const catalog = JSON.parse(
  await readFile(
    new URL('../src/data/youtube-videos.json', import.meta.url),
    'utf8',
  ),
)
const locations = JSON.parse(
  await readFile(
    new URL('../src/data/business-locations.json', import.meta.url),
    'utf8',
  ),
)
const geocodes = JSON.parse(
  await readFile(
    new URL('../src/data/business-geocodes.json', import.meta.url),
    'utf8',
  ),
)
for (const [id, location] of Object.entries(locations)) {
  const addresses = extractBusinessAddresses(catalog[id]?.description)
  assert.equal(
    addresses.length,
    1,
    `${id}: ambiguous or stale published address`,
  )
  assert.equal(location.address, addresses[0].address)
  assert.ok(
    isPreciseAddressMatch(addresses[0], geocodes[location.address]),
    `${id}: imprecise geocode`,
  )
  assert.equal(location.latitude, Number(geocodes[location.address].lat))
  assert.equal(location.longitude, Number(geocodes[location.address].lon))
}
console.log(
  `Validated ${Object.keys(locations).length} published business addresses against saved descriptions and geocodes.`,
)
