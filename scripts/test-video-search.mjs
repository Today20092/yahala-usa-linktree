import assert from 'node:assert/strict'

import {
  chunkTranscript,
  createVideoSearch,
  parseTimedText,
} from '../src/worker/video-search.js'
import youtubeVideos from '../src/data/youtube-videos.json' with { type: 'json' }

const videoSearch = createVideoSearch({})
assert.deepEqual(Object.keys(videoSearch).sort(), [
  'availability',
  'consume',
  'indexVideo',
  'reindex',
  'search',
  'status',
  'sync',
])

const transcript = `WEBVTT

00:00:01.000 --> 00:00:08.500
Welcome to Ya Hala.

00:00:08.500 --> 00:00:25.000
Today we are visiting an Arab business in New York.

00:00:25.000 --> 00:00:49.000
The owner explains how the company started.

00:00:49.000 --> 00:01:07.000
وهنا نتحدث عن تجربة صاحب المشروع.
`

const events = parseTimedText(transcript)
assert.equal(events.length, 4)
assert.equal(events[0].start, 1)
assert.equal(events[3].end, 67)
assert.match(events[3].text, /تجربة/)

const chunks = chunkTranscript(events, 45, 10)
assert.ok(chunks.length >= 2)
assert.equal(chunks[0].start, 1)
assert.match(chunks[0].text, /Arab business/)
assert.ok(chunks[1].start < chunks[0].end)

const storedTranscript = {
  videoId: 'abcdefghijk',
  title: 'Cached transcript',
  thumbnail: '',
  published: '',
  duration: 'PT1M7S',
  language: 'en',
  landscapeEligibility: 'catalog',
  events,
}
const writes = []
const upserts = []
const cachedSearch = createVideoSearch({
  TRANSCRIPTS_R2: {
    get: async (key) =>
      key.startsWith('transcripts/')
        ? { json: async () => storedTranscript }
        : { json: async () => ({ status: 'pending' }) },
    put: async (key, value) => writes.push([key, JSON.parse(value)]),
  },
  AI: {
    run: async (_model, { text }) => ({
      data: text.map(() => [0.1, 0.2]),
    }),
  },
  VECTORIZE: {
    upsert: async (vectors) => upserts.push(...vectors),
  },
})
const cachedResult = await cachedSearch.indexVideo(storedTranscript.videoId)
assert.equal(cachedResult.status, 'indexed')
assert.equal(upserts.length, chunks.length)
assert.equal(writes.at(-1)[1].chunkCount, chunks.length)
assert.equal(writes.at(-1)[1].reason, null)

const eligibleVideoIds = Object.values(youtubeVideos)
  .filter(
    (video) =>
      video.channelId === 'UC26OIuJ19EH6HF6uRJ-N_2A' &&
      video.isShort === false,
  )
  .map((video) => video.videoId)
const verifiedVideoId = eligibleVideoIds[0]
const statusWrites = []
const statusSearchEnvironment = {
  ADMIN_API_TOKEN: 'test-token',
  TRANSCRIPTS_R2: {
    get: async (key) => {
      if (key === `transcripts/${verifiedVideoId}.json`) {
        return { json: async () => ({ ...storedTranscript, videoId: verifiedVideoId }) }
      }
      if (key === `manifests/${verifiedVideoId}.json`) {
        return {
          json: async () => ({
            videoId: verifiedVideoId,
            status: 'indexed',
            embeddingModel: '@cf/baai/bge-m3',
          }),
        }
      }
      if (key.startsWith('manifests/')) {
        return {
          json: async () => ({ status: 'skipped', reason: 'captions-unavailable' }),
        }
      }
      return null
    },
    put: async (key, value) => statusWrites.push([key, JSON.parse(value)]),
  },
  VECTORIZE: {
    getByIds: async (ids) => ids.map((id) => ({ id })),
  },
}
const statusSearch = createVideoSearch(statusSearchEnvironment)
const statusResponse = await statusSearch.status(
  new Request('https://example.com/api/admin/video-search/status', {
    headers: { authorization: 'Bearer test-token' },
  }),
)
const statusPayload = await statusResponse.json()
assert.equal(statusPayload.searchReady, true)
assert.equal(statusPayload.counts.verified, 1)
assert.equal(statusPayload.counts.excludedNoCaptions, eligibleVideoIds.length - 1)
assert.equal(statusPayload.incompleteVideos.length, 0)
assert.equal(statusWrites.at(-1)[0], 'coverage/latest.json')

const queuedVideoIds = []
statusSearchEnvironment.VECTORIZE.getByIds = async () => []
statusSearchEnvironment.VIDEO_INDEX_QUEUE = {
  send: async ({ videoId }) => queuedVideoIds.push(videoId),
}
const syncResult = await createVideoSearch(statusSearchEnvironment).sync()
assert.equal(syncResult.queued, 1)
assert.deepEqual(queuedVideoIds, [verifiedVideoId])

const repairedVectors = []
statusSearchEnvironment.AI = {
  run: async (_model, { text }) => ({ data: text.map(() => [0.1, 0.2]) }),
}
statusSearchEnvironment.VECTORIZE.upsert = async (vectors) =>
  repairedVectors.push(...vectors)
const repairResult = await createVideoSearch(statusSearchEnvironment).indexVideo(
  verifiedVideoId,
)
assert.equal(repairResult.status, 'indexed')
assert.equal(repairedVectors.length, chunks.length)

const availabilityResponse = await createVideoSearch({
  TRANSCRIPTS_R2: {
    get: async (key) =>
      key === 'coverage/latest.json'
        ? { json: async () => ({ searchReady: true, checkedAt: '2026-07-13' }) }
        : null,
  },
}).availability()
assert.deepEqual(await availabilityResponse.json(), {
  searchReady: true,
  checkedAt: '2026-07-13',
})

console.log('Video search transcript tests passed.')
