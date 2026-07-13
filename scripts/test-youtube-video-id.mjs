import { getYoutubeVideoId } from '../src/lib/youtube-video-id.js'

const videoId = 'dQw4w9WgXcQ'
const cases = [
  [videoId, videoId],
  [`https://youtu.be/${videoId}?feature=shared`, videoId],
  [`https://www.youtube.com/watch?v=${videoId}`, videoId],
  [`https://youtube.com/embed/${videoId}`, videoId],
  [`https://youtube.com/shorts/${videoId}`, videoId],
  [`https://youtube.com/live/${videoId}`, videoId],
  ['https://example.com/watch?v=dQw4w9WgXcQ', ''],
  ['https://youtu.be/too-short', ''],
  ['', ''],
]

for (const [input, expected] of cases) {
  const actual = getYoutubeVideoId(input)
  if (actual !== expected) {
    throw new Error(
      `Expected ${JSON.stringify(input)} to resolve to ${expected}, got ${actual}`,
    )
  }
}

console.log('YouTube video identity is valid.')
