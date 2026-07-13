import { buildVisitedPlacePresentation } from '../src/lib/visited-place-presentation.js'

const video = (videoId) => ({ videoId, url: `https://youtu.be/${videoId}` })
const result = buildVisitedPlacePresentation(
  [
    {
      city: 'Austin',
      state: ' Texas ',
      label: 'Austin, TX',
      stateAbbreviation: 'TX',
      latitude: 30.27,
      longitude: -97.74,
      videos: [video('aaaaaaaaaaa'), video('bbbbbbbbbbb')],
    },
    { city: 'Dallas', state: 'Texas', videos: [video('ccccccccccc')] },
    { city: 'Miami', state: 'Florida' },
  ],
  [
    {
      state: 'Texas',
      videos: [
        video('ddddddddddd'),
        video('eeeeeeeeeee'),
        video('fffffffffff'),
        video('ggggggggggg'),
      ],
    },
  ],
)

if (result.stateGroups[0].videoCount !== 7) {
  throw new Error('Expected normalized state groups ordered by video count')
}
if (
  result.stateGroups[0].places[0].videos.length !== 2 ||
  result.stateGroups[0].stateVideos.length !== 3
) {
  throw new Error('Expected the default three-video presentation limit')
}
if (
  result.mapPlaces.length !== 1 ||
  result.mapPlaces[0].label !== 'Austin, TX'
) {
  throw new Error('Expected display-ready map places')
}
if (new Set(result.stateGroups[0].places.map((place) => place.id)).size !== 2) {
  throw new Error('Expected unique place IDs')
}

console.log('Visited-place presentation is valid.')
