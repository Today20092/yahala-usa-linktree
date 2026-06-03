import { readFile, writeFile } from 'node:fs/promises'

const channelsPath = new URL('../src/data/youtube-channels.json', import.meta.url)
const outputPath = new URL('../src/data/latest-youtube-videos.json', import.meta.url)

const textFrom = (xml, tagName) => {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`))
  return match ? decodeXml(match[1].trim()) : ''
}

const attrFrom = (xml, tagName, attrName) => {
  const match = xml.match(new RegExp(`<${tagName}[^>]*\\s${attrName}="([^"]+)"`))
  return match ? decodeXml(match[1]) : ''
}

const decodeXml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

const entriesFromFeed = (feed) =>
  [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entry = match[1]
    const videoId = textFrom(entry, 'yt:videoId')

    return {
      videoId,
      title: textFrom(entry, 'title'),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: attrFrom(entry, 'media:thumbnail', 'url'),
      published: textFrom(entry, 'published'),
      updated: textFrom(entry, 'updated'),
    }
  })

const latestVideoIdFromVideosTab = async (videosUrl) => {
  if (!videosUrl) return ''

  const response = await fetch(videosUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; YaHalaLinktree/1.0; +https://today20092.github.io/yahala-usa-linktree/)',
    },
  })

  if (!response.ok) {
    throw new Error(
      `YouTube videos tab request failed for ${videosUrl}: ${response.status} ${response.statusText}`,
    )
  }

  const html = await response.text()
  const videoIds = [
    ...html.matchAll(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/g),
    ...html.matchAll(/watch\?v=([a-zA-Z0-9_-]{11})/g),
  ].map((match) => match[1])

  return [...new Set(videoIds)][0] ?? ''
}

const fetchLatestVideo = async ({ id, channelId, videosUrl }) => {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const response = await fetch(feedUrl)

  if (!response.ok) {
    throw new Error(`YouTube feed request failed for ${channelId}: ${response.status} ${response.statusText}`)
  }

  const feed = await response.text()
  const feedEntries = entriesFromFeed(feed)

  if (feedEntries.length === 0) {
    throw new Error(`No videos found in YouTube feed for ${channelId}`)
  }

  let latestVideoId = ''

  try {
    latestVideoId = await latestVideoIdFromVideosTab(videosUrl)
  } catch (error) {
    console.warn(error.message)
  }

  const latestEntry =
    feedEntries.find((entry) => entry.videoId === latestVideoId) ??
    feedEntries[0]

  return [
    id,
    {
      channelId,
      channelTitle: textFrom(feed, 'title'),
      ...latestEntry,
    },
  ]
}

const channels = JSON.parse(await readFile(channelsPath, 'utf8'))
const entries = await Promise.all(channels.map(fetchLatestVideo))
const latestVideos = Object.fromEntries(entries)

await writeFile(outputPath, `${JSON.stringify(latestVideos, null, 2)}\n`)

for (const channel of channels) {
  console.log(`${channel.name}: ${latestVideos[channel.id].title}`)
}
