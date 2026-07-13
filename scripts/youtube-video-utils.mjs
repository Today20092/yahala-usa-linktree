import {
  getYoutubeVideoId,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from '../src/lib/youtube-video-id.js'

export { getYoutubeVideoId, youtubeWatchUrl }

export const fallbackThumbnail = youtubeThumbnailUrl

export const normalizeThumbnailUrl = (videoId, thumbnail = '') =>
  videoId ? fallbackThumbnail(videoId) : String(thumbnail).trim()

export const uniqueVideos = (videos) => {
  const seen = new Set()

  return videos.filter((video) => {
    const videoId = video?.videoId ?? getYoutubeVideoId(video?.url)
    if (!videoId || seen.has(videoId)) return false

    seen.add(videoId)
    return true
  })
}

const decodeXml = (value = '') =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')

const decodeJsonString = (value = '') => {
  try {
    return JSON.parse(`"${value.replaceAll('"', '\\"')}"`)
  } catch {
    return value
  }
}

const textFrom = (xml, tagName) => {
  const match = xml.match(
    new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`),
  )
  return match ? decodeXml(match[1].trim()) : ''
}

const attrFrom = (xml, tagName, attrName) => {
  const match = xml.match(
    new RegExp(`<${tagName}[^>]*\\s${attrName}="([^"]*)"`, 'i'),
  )
  return match ? decodeXml(match[1].trim()) : ''
}

export const entriesFromFeed = (feed) =>
  [...feed.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
    const entry = match[1]
    const videoId = textFrom(entry, 'yt:videoId')

    return {
      videoId,
      title: textFrom(entry, 'title'),
      url: youtubeWatchUrl(videoId),
      thumbnail: attrFrom(entry, 'media:thumbnail', 'url'),
      published: textFrom(entry, 'published'),
      updated: textFrom(entry, 'updated'),
    }
  })

export const normalizeVideoMetadata = (video, existing = {}) => {
  const videoId =
    video?.videoId ?? getYoutubeVideoId(video?.url) ?? existing.videoId
  if (!videoId) return null

  const viewCount = Number(
    video?.viewCount ?? video?.view_count ?? existing.viewCount,
  )

  return {
    ...existing,
    ...video,
    videoId,
    url: youtubeWatchUrl(videoId),
    title: video?.title ?? existing.title ?? 'Watch on YouTube',
    thumbnail: normalizeThumbnailUrl(
      videoId,
      video?.thumbnail ?? existing.thumbnail,
    ),
    published: video?.published ?? existing.published ?? '',
    updated:
      video?.updated ??
      existing.updated ??
      video?.published ??
      existing.published ??
      '',
    channelId: video?.channelId ?? existing.channelId ?? '',
    channelTitle: video?.channelTitle ?? existing.channelTitle ?? '',
    duration: video?.duration ?? existing.duration ?? '',
    description: video?.description || existing.description || '',
    tags:
      Array.isArray(video?.tags) && video.tags.length > 0
        ? video.tags
        : (existing.tags ?? []),
    categories:
      Array.isArray(video?.categories) && video.categories.length > 0
        ? video.categories
        : (existing.categories ?? []),
    locationHints: video?.locationHints ?? existing.locationHints,
    viewCount: Number.isFinite(viewCount) ? viewCount : undefined,
    fullMetadataFetchedAt:
      video?.fullMetadataFetchedAt ?? existing.fullMetadataFetchedAt,
    isShort: video?.isShort ?? existing.isShort ?? false,
  }
}

export const videosWithFallbackThumbnails = (videos) =>
  uniqueVideos(videos)
    .map((video) => normalizeVideoMetadata(video))
    .filter(Boolean)

export const deriveChannelCatalog = ({
  channel,
  previous,
  cache = {},
  feedChannelTitle = '',
  feedVideos = [],
  tabVideos = [],
}) => {
  const channelTitle =
    feedChannelTitle || previous?.channelTitle || channel.name
  const previousVideoIds =
    previous?.videoIds?.length > 0
      ? previous.videoIds
      : [
          previous?.latestVideoId,
          previous?.videoId,
          ...(previous?.videos ?? []).map((video) => video.videoId),
        ].filter(Boolean)
  const normalizedFeedVideos = feedVideos.map((video) => ({
    ...video,
    channelId: channel.channelId,
    channelTitle,
  }))
  let videos = videosWithFallbackThumbnails(
    uniqueVideos([...tabVideos, ...normalizedFeedVideos]).map((video) => {
      const feedVideo = normalizedFeedVideos.find(
        (entry) => entry.videoId === video.videoId,
      )
      return normalizeVideoMetadata(
        {
          ...video,
          title: feedVideo?.title || video.title,
          thumbnail: feedVideo?.thumbnail || video.thumbnail,
          published: feedVideo?.published || video.published,
          updated: feedVideo?.updated || video.updated,
          channelId: channel.channelId,
          channelTitle,
        },
        cache[video.videoId],
      )
    }),
  )

  if (videos.length === 0) {
    videos = previousVideoIds
      .map((videoId) =>
        normalizeVideoMetadata(
          { videoId, channelId: channel.channelId, channelTitle },
          cache[videoId],
        ),
      )
      .filter(Boolean)
  }
  if (videos.length === 0) return null

  const videoIds = videos.map((video) => video.videoId)
  return {
    latest: {
      channelId: channel.channelId,
      channelTitle,
      latestVideoId:
        videos[0]?.videoId ??
        previous?.latestVideoId ??
        previous?.videoId ??
        '',
      videoIds,
    },
    videos,
  }
}

export const videoMetadataFromWatchPage = async (videoId) => {
  if (!videoId) return null

  const response = await fetch(youtubeWatchUrl(videoId), {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; YaHalaBot/1.0; +https://github.com/)',
    },
  })

  if (!response.ok) {
    throw new Error(
      `YouTube watch page request failed for ${videoId}: ${response.status} ${response.statusText}`,
    )
  }

  const html = await response.text()
  const rawTitle = html.match(
    /"videoDetails":\{"videoId":"[^"]+","title":"([^"]+)"/,
  )?.[1]
  const published = html.match(/"publishDate":"([^"]+)"/)?.[1] ?? ''
  const thumbnail =
    html.match(/"thumbnailUrl":"([^"]+)"/)?.[1] ?? fallbackThumbnail(videoId)
  const isShort =
    html.includes(`/shorts/${videoId}`) ||
    html.includes(`\\/shorts\\/${videoId}`)

  return normalizeVideoMetadata({
    videoId,
    title: rawTitle ? decodeJsonString(rawTitle) : undefined,
    thumbnail: decodeXml(thumbnail),
    published,
    updated: published,
    isShort,
  })
}

export const videosFromVideosTab = async (videosUrl) => {
  if (!videosUrl) return []

  const response = await fetch(videosUrl, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; YaHalaBot/1.0; +https://github.com/)',
    },
  })

  if (!response.ok) {
    throw new Error(
      `YouTube videos tab request failed for ${videosUrl}: ${response.status} ${response.statusText}`,
    )
  }

  const html = await response.text()
  const videoIds = [
    ...new Set(
      [...html.matchAll(/watch\?v=([a-zA-Z0-9_-]{11})/g)].map(
        (match) => match[1],
      ),
    ),
  ]

  const videos = []
  const requestDelayMs = Number(process.env.YOUTUBE_REQUEST_DELAY_MS ?? 1500)

  for (const videoId of videoIds) {
    if (requestDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, requestDelayMs))
    }

    const video = await videoMetadataFromWatchPage(videoId).catch(() =>
      normalizeVideoMetadata({ videoId }),
    )
    if (video) videos.push(video)
  }

  return uniqueVideos(videos)
}

export const mergeVideoCache = (cache, videos) => {
  const nextCache = { ...cache }

  for (const video of videos) {
    const videoId = video?.videoId ?? getYoutubeVideoId(video?.url)
    if (!videoId) continue

    const normalized = normalizeVideoMetadata(video, nextCache[videoId])
    if (normalized) nextCache[videoId] = normalized
  }

  return nextCache
}
