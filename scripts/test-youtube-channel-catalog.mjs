import {
  deriveChannelCatalog,
  isValidYoutubePublishedDate,
  mergeVideoCache,
} from './youtube-video-utils.mjs'

const channel = { id: 'main', channelId: 'channel', name: 'YaHala' }
const result = deriveChannelCatalog({
  channel,
  feedChannelTitle: 'YaHala USA',
  feedVideos: [{ videoId: 'aaaaaaaaaaa', title: 'Feed title' }],
  tabVideos: [
    { videoId: 'bbbbbbbbbbb', title: 'Tab title' },
    { videoId: 'aaaaaaaaaaa', title: 'Old title' },
  ],
  previous: { latestVideoId: 'ccccccccccc' },
  cache: {
    aaaaaaaaaaa: { videoId: 'aaaaaaaaaaa', description: 'Cached detail' },
  },
})

if (result?.latest.videoIds.join(',') !== 'bbbbbbbbbbb,aaaaaaaaaaa') {
  throw new Error('Expected tab order with feed metadata merged')
}
if (result.videos[1].title !== 'Feed title') {
  throw new Error('Expected feed metadata to override matching tab metadata')
}
if (result.videos[1].description !== 'Cached detail') {
  throw new Error('Expected rich cached metadata to survive a normal refresh')
}

const fallback = deriveChannelCatalog({
  channel,
  previous: { videoIds: ['ccccccccccc'] },
  cache: { ccccccccccc: { videoId: 'ccccccccccc', title: 'Cached' } },
})
if (fallback?.videos[0].title !== 'Cached') {
  throw new Error('Expected cached catalog fallback')
}

const legacyFallback = deriveChannelCatalog({
  channel,
  previous: { videoIds: [], latestVideoId: 'ccccccccccc' },
  cache: { ccccccccccc: { videoId: 'ccccccccccc', title: 'Legacy cached' } },
})
if (legacyFallback?.videos[0].title !== 'Legacy cached') {
  throw new Error('Expected empty videoIds to use legacy catalog fallback')
}

const publicationCache = mergeVideoCache(
  {
    ddddddddddd: {
      videoId: 'ddddddddddd',
      published: '2025-01-02',
    },
  },
  [
    { videoId: 'ddddddddddd', published: '' },
    { videoId: 'eeeeeeeeeee', published: '2025-03-04' },
    { videoId: 'fffffffffff', published: 'not-a-date' },
    null,
  ],
)
if (publicationCache.ddddddddddd.published !== '2025-01-02') {
  throw new Error('Expected a failed refresh to preserve a trustworthy date')
}
if (publicationCache.eeeeeeeeeee.published !== '2025-03-04') {
  throw new Error('Expected a successful backfill to retain its date')
}
if (publicationCache.fffffffffff.published !== '') {
  throw new Error('Expected invalid publication dates to remain empty')
}
if (Object.keys(publicationCache).length !== 3) {
  throw new Error('Expected an unavailable-video result to be recoverable')
}
if (!isValidYoutubePublishedDate('2025-01-02T03:04:05Z')) {
  throw new Error('Expected ISO 8601 publication timestamps to be valid')
}
if (isValidYoutubePublishedDate('2025-02-30')) {
  throw new Error('Expected impossible calendar dates to be invalid')
}

console.log('YouTube channel catalog is valid.')
