import youtubeVideos from '../data/youtube-videos.json'
import storyTitles from '../data/story-titles.json'
import {
  getYoutubeVideoId,
  youtubeThumbnailFallbackUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from './youtube-video-id.js'

export {
  getYoutubeVideoId,
  resolveYoutubeReference,
  youtubeThumbnailFallbackUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from './youtube-video-id.js'

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
  width?: number
  height?: number
}

export type YoutubeVideoRef = {
  videoId?: string
  url?: string
  title?: string
  thumbnail?: string
  published?: string
}

// Keep curated display titles separate from the refreshed YouTube metadata.
export const youtubeVideosById: Record<string, YoutubeVideo> =
  Object.fromEntries(
    Object.entries(youtubeVideos).map(([id, video]) => [
      id,
      {
        ...video,
        title: (storyTitles as Record<string, string>)[id] ?? video.title,
      },
    ]),
  )

export const resolveYoutubeThumbnailUrl = (
  videoId: string,
  thumbnail?: string,
) => {
  if (videoId) return youtubeThumbnailUrl(videoId)
  return thumbnail?.trim() ?? ''
}

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
    title:
      (storyTitles as Record<string, string>)[videoId] ??
      videoRef?.title ??
      cachedVideo?.title ??
      'Open on YouTube',
    published: videoRef?.published ?? cachedVideo?.published,
    thumbnail: resolveYoutubeThumbnailUrl(
      videoId,
      videoRef?.thumbnail ?? cachedVideo?.thumbnail,
    ),
  }
}

export const resolveYoutubeVideos = (videoRefs: YoutubeVideoRef[] = []) =>
  videoRefs.map((videoRef) => resolveYoutubeVideo(videoRef)).filter(Boolean)
