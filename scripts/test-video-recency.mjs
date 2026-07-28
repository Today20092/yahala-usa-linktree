import assert from 'node:assert/strict'

import {
  isRecentVideo,
  sortVideosByPublishedDate,
} from '../src/lib/video-recency.js'

const videos = [
  { title: 'Undated first' },
  { title: 'Older', published: '2026-05-01T12:00:00Z' },
  { title: 'Invalid', published: 'not-a-date' },
  { title: 'Newest', published: '2026-07-01T12:00:00Z' },
  { title: 'Undated second' },
]

assert.deepEqual(
  sortVideosByPublishedDate(videos).map((video) => video.title),
  ['Newest', 'Older', 'Undated first', 'Invalid', 'Undated second'],
)
assert.deepEqual(
  sortVideosByPublishedDate(videos, 'oldest').map((video) => video.title),
  ['Older', 'Newest', 'Undated first', 'Invalid', 'Undated second'],
)
assert.deepEqual(
  videos.map((video) => video.title),
  ['Undated first', 'Older', 'Invalid', 'Newest', 'Undated second'],
)

const now = new Date('2026-07-17T12:00:00Z')
assert.equal(isRecentVideo('2026-06-05T12:00:00Z', now), true)
assert.equal(isRecentVideo('2026-06-05T11:59:59Z', now), false)
assert.equal(isRecentVideo('not-a-date', now), false)
assert.equal(isRecentVideo(undefined, now), false)
assert.equal(isRecentVideo('2026-07-17T12:00:01Z', now), false)

console.log('Video ordering and recency checks pass.')
