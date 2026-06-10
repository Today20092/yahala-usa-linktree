import youtubeVideos from '../data/youtube-videos.json'

export type YoutubeVideo = {
  videoId: string
  url: string
  title: string
  thumbnail: string
  published?: string
  updated?: string
  channelId?: string
  channelTitle?: string
  duration?: string
  viewCount?: number
  isShort?: boolean
}

export type YoutubeVideoRef = {
  videoId?: string
  url?: string
  title?: string
  thumbnail?: string
}

export const youtubeVideosById = youtubeVideos as Record<string, YoutubeVideo>

export const getYoutubeVideoId = (urlOrId?: string) => {
  if (!urlOrId) return ''

  const value = String(urlOrId).trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value

  try {
    const parsedUrl = new URL(value)
    const host = parsedUrl.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] ?? ''
    }

    if (host.endsWith('youtube.com')) {
      if (parsedUrl.searchParams.has('v')) {
        return parsedUrl.searchParams.get('v') ?? ''
      }

      const parts = parsedUrl.pathname.split('/').filter(Boolean)
      const videoPathIndex = parts.findIndex((part) =>
        ['embed', 'shorts', 'live'].includes(part),
      )

      if (videoPathIndex >= 0) return parts[videoPathIndex + 1] ?? ''
    }
  } catch {
    return ''
  }

  return ''
}

const youtubeWatchUrl = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`

const fallbackThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

export const resolveYoutubeVideo = (
  videoRef?: YoutubeVideoRef | null,
): YoutubeVideo | undefined => {
  const videoId = videoRef?.videoId ?? getYoutubeVideoId(videoRef?.url)
  if (!videoId) return undefined

  const cachedVideo = youtubeVideosById[videoId]

  return {
    ...cachedVideo,
    videoId,
    url: youtubeWatchUrl(videoId),
    title: videoRef?.title ?? cachedVideo?.title ?? 'Watch on YouTube',
    thumbnail:
      videoRef?.thumbnail ??
      cachedVideo?.thumbnail ??
      fallbackThumbnail(videoId),
  }
}

export const resolveYoutubeVideos = (videoRefs: YoutubeVideoRef[] = []) =>
  videoRefs.map((videoRef) => resolveYoutubeVideo(videoRef)).filter(Boolean)
