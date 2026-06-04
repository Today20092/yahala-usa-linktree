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

const latestVideoMetadataFromWatchPage = async (videoId) => {
  if (!videoId) return null

  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; YaHalaLinktree/1.0; +https://today20092.github.io/yahala-usa-linktree/)',
    },
  })

  if (!response.ok) {
    throw new Error(
      `YouTube watch page request failed for ${videoId}: ${response.status} ${response.statusText}`,
    )
  }

  const html = await response.text()
  const title = html.match(
    /"videoDetails":\{"videoId":"[^"]+","title":"([^"]+)"/,
  )?.[1]
  const published = html.match(/"publishDate":"([^"]+)"/)?.[1] ?? ''
  const thumbnail =
    html.match(/"thumbnailUrl":"([^"]+)"/)?.[1] ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  if (!title) return null

  return {
    videoId,
    title: decodeXml(title),
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail: decodeXml(thumbnail),
    published,
    updated: published,
  }
}

const fetchLatestVideo = async (channel, previousLatestVideo) => {
  const { id, channelId, videosUrl, name } = channel
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const response = await fetch(feedUrl)
  let channelTitle = previousLatestVideo?.channelTitle ?? name

  if (response.ok) {
    const feed = await response.text()
    const feedEntries = entriesFromFeed(feed)
    const feedChannelTitle = textFrom(feed, 'title')

    if (feedEntries.length > 0) {
      channelTitle = feedChannelTitle || channelTitle

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
          channelTitle,
          ...latestEntry,
        },
      ]
    }
  }

  if (!response.ok) {
    console.warn(
      `YouTube feed request failed for ${channelId}: ${response.status} ${response.statusText}`,
    )
  } else {
    console.warn(`No videos found in YouTube feed for ${channelId}`)
  }

  try {
    const latestVideoId = await latestVideoIdFromVideosTab(videosUrl)
    const latestVideo = await latestVideoMetadataFromWatchPage(latestVideoId)

    if (latestVideo) {
      return [
        id,
        {
          channelId,
          channelTitle,
          ...latestVideo,
        },
      ]
    }
  } catch (error) {
    console.warn(error.message)
  }

  if (previousLatestVideo) {
    console.warn(`Using cached YouTube data for ${name}`)
    return [id, previousLatestVideo]
  }

  return null
}

const channels = JSON.parse(await readFile(channelsPath, 'utf8'))
const previousLatestVideos = JSON.parse(
  await readFile(outputPath, 'utf8').catch(() => '{}'),
)

const entries = await Promise.allSettled(
  channels.map((channel) =>
    fetchLatestVideo(channel, previousLatestVideos[channel.id]),
  ),
)

const latestVideos = { ...previousLatestVideos }

for (const entry of entries) {
  if (entry.status === 'fulfilled' && entry.value) {
    const [id, video] = entry.value
    latestVideos[id] = video
  }
}

await writeFile(outputPath, `${JSON.stringify(latestVideos, null, 2)}\n`)

for (const channel of channels) {
  if (latestVideos[channel.id]) {
    console.log(`${channel.name}: ${latestVideos[channel.id].title}`)
  } else {
    console.warn(`Skipped ${channel.name} - unable to fetch latest video`)
  }
}
