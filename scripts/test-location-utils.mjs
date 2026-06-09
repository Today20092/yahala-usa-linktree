import { testLocationUtils } from './location-utils.mjs'
import { addVisitedPlaces } from './site-places-utils.mjs'

await testLocationUtils()

const siteConfig = {
  visitedPlaces: {
    places: [
      { city: 'Chicago', state: 'Illinois', latitude: 41.8781, longitude: -87.6298 },
    ],
  },
}
const added = addVisitedPlaces(siteConfig, [
  { city: 'Chicago', state: 'Illinois', latitude: 41.8781, longitude: -87.6298 },
  { city: 'Columbus', state: 'Ohio', latitude: 39.9612, longitude: -82.9988 },
])
if (added.length !== 1 || added[0].city !== 'Columbus') {
  throw new Error('Expected only missing valid places to be added')
}

console.log('Location utilities are valid.')
