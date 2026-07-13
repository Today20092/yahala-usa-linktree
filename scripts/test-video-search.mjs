import assert from 'node:assert/strict'

import {
  chunkTranscript,
  createVideoSearch,
  parseTimedText,
} from '../src/worker/video-search.js'

const videoSearch = createVideoSearch({})
assert.deepEqual(Object.keys(videoSearch).sort(), [
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

console.log('Video search transcript tests passed.')
