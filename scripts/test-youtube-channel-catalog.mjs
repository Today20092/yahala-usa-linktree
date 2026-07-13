import { deriveChannelCatalog } from './youtube-video-utils.mjs'

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

console.log('YouTube channel catalog is valid.')
