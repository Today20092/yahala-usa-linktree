import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { parse } from 'yaml'

import {
  entriesFromFeed,
  mergeVideoCache,
  normalizeVideoMetadata,
  uniqueVideos,
  videosFromVideosTab,
  videosWithFallbackThumbnails,
  youtubeWatchUrl,
} from './youtube-video-utils.mjs'

const execFileAsync = promisify(execFile)
const siteConfigPath = new URL('../src/data/site.yaml', import.meta.url)
const latestOutputPath = new URL(
  '../src/data/latest-youtube-videos.json',
  import.meta.url,
)
const videoCachePath = new URL(
  '../src/data/youtube-videos.json',
  import.meta.url,
)
const refreshTopVideos = process.argv.includes('--refresh-top-videos')

const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

const ytdlpDate = (value) =>
  value && /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : ''

const mapLimit = async (items, limit, mapper) => {
  const results = new Array(items.length)
  let index = 0

  const workers = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const currentIndex = index
      index += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  })

  await Promise.all(workers)
  return results
}

const fetchPlaylistVideos = async (videosUrl, channel) => {
  try {
    const result = await execFileAsync(
      'yt-dlp',
      ['--dump-json', '--flat-playlist', videosUrl],
      { maxBuffer: 1024 * 1024 * 32 },
    )

    return result.stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((video) => video?.id)
      .map((video) => ({
        videoId: video.id,
        url: youtubeWatchUrl(video.id),
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration_string ?? '',
        channelId: channel.channelId,
        channelTitle: channel.name,
      }))
  } catch (error) {
    console.warn(
      `Unable to fetch ${channel.name} playlist with yt-dlp: ${error.message}`,
    )
    return []
  }
}

const fetchVideoStats = async (video, channel) => {
  try {
    const result = await execFileAsync(
      'yt-dlp',
      ['--dump-single-json', '--skip-download', youtubeWatchUrl(video.videoId)],
      { maxBuffer: 1024 * 1024 * 32 },
    )
    const metadata = JSON.parse(result.stdout)

    return normalizeVideoMetadata(
      {
        ...video,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration_string ?? video.duration,
        published: ytdlpDate(metadata.upload_date) || video.published,
        updated: ytdlpDate(metadata.upload_date) || video.updated,
        viewCount: metadata.view_count,
        channelId: channel.channelId,
        channelTitle: channel.name,
      },
      video,
    )
  } catch (error) {
    console.warn(
      `Unable to fetch view count for ${video.videoId}: ${error.message}`,
    )
    return normalizeVideoMetadata(video)
  }
}

const fetchTopVideos = async (channel, videoCache) => {
  const playlistVideos = await fetchPlaylistVideos(channel.videosUrl, channel)
  if (playlistVideos.length === 0) return { videos: [], topVideoIds: [] }

  const videosWithCachedViews = playlistVideos.map((video) =>
    normalizeVideoMetadata(video, videoCache[video.videoId]),
  )
  const videosNeedingViews = videosWithCachedViews.filter(
    (video) => !Number.isFinite(Number(video?.viewCount)),
  )
  const existingVideosWithViews = videosWithCachedViews.filter((video) =>
    Number.isFinite(Number(video?.viewCount)),
  )

  console.log(
    `${channel.name}: refreshing view counts for ${playlistVideos.length} videos.`,
  )

  const refreshedVideos = (
    await mapLimit(playlistVideos, 3, (video) =>
      fetchVideoStats(video, channel),
    )
  ).filter(Boolean)

  const videos =
    refreshedVideos.length > 0
      ? refreshedVideos
      : [...existingVideosWithViews, ...videosNeedingViews]
  const topVideoIds = videos
    .filter(
      (video) => Number.isFinite(Number(video.viewCount)) && !video.isShort,
    )
    .sort((a, b) => Number(b.viewCount) - Number(a.viewCount))
    .slice(0, 3)
    .map((video) => video.videoId)

  return { videos, topVideoIds }
}

const fetchLatestVideo = async (channel, previousLatestVideo, videoCache) => {
  const { id, channelId, videosUrl, name } = channel
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  const previousVideoIds =
    previousLatestVideo?.videoIds ??
    [
      previousLatestVideo?.latestVideoId,
      previousLatestVideo?.videoId,
      ...(previousLatestVideo?.videos ?? []).map((video) => video.videoId),
    ].filter(Boolean)

  let channelTitle = previousLatestVideo?.channelTitle ?? name
  let videos = []

  try {
    const feedResponse = await fetch(feedUrl)

    if (!feedResponse.ok) {
      throw new Error(
        `YouTube feed request failed for ${channelId}: ${feedResponse.status} ${feedResponse.statusText}`,
      )
    }

    const feed = await feedResponse.text()
    const feedChannelTitle =
      feed.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? ''
    if (feedChannelTitle) channelTitle = feedChannelTitle

    const feedEntries = entriesFromFeed(feed).map((video) => ({
      ...video,
      channelId,
      channelTitle,
    }))
    const videosTabEntries = await videosFromVideosTab(videosUrl).catch(
      (error) => {
        console.warn(error.message)
        return []
      },
    )

    videos = videosWithFallbackThumbnails(
      uniqueVideos([...videosTabEntries, ...feedEntries]).map((video) => {
        const feedEntry = feedEntries.find(
          (entry) => entry.videoId === video.videoId,
        )

        return {
          ...video,
          title: feedEntry?.title || video.title,
          thumbnail: feedEntry?.thumbnail || video.thumbnail,
          published: feedEntry?.published || video.published,
          updated: feedEntry?.updated || video.updated,
          channelId,
          channelTitle,
        }
      }),
    )
  } catch (error) {
    console.warn(error.message)
  }

  if (videos.length === 0) {
    videos = previousVideoIds
      .map((videoId) =>
        normalizeVideoMetadata(
          { videoId, channelId, channelTitle },
          videoCache[videoId],
        ),
      )
      .filter(Boolean)
  }

  if (videos.length === 0) {
    console.warn(`Skipped ${name} - unable to fetch latest video`)
    return null
  }

  const videoIds = videos.map((video) => video.videoId)
  const latestVideoId =
    videos[0]?.videoId ??
    previousLatestVideo?.latestVideoId ??
    previousLatestVideo?.videoId ??
    ''

  return [
    id,
    {
      channelId,
      channelTitle,
      latestVideoId,
      videoIds,
    },
    videos,
  ]
}

const siteConfig = parse(await readFile(siteConfigPath, 'utf8'))
const channels = siteConfig.youtubeChannels ?? []
const previousLatestVideos = await readJson(latestOutputPath, {})
let videoCache = await readJson(videoCachePath, {})

for (const channelLatest of Object.values(previousLatestVideos)) {
  const oldVideos = [channelLatest, ...(channelLatest?.videos ?? [])].filter(
    (video) => video?.videoId,
  )
  videoCache = mergeVideoCache(videoCache, oldVideos)
}

const latestEntries = (
  await Promise.all(
    channels.map((channel) =>
      fetchLatestVideo(channel, previousLatestVideos[channel.id], videoCache),
    ),
  )
).filter(Boolean)

const latestVideos = Object.fromEntries(
  latestEntries.map(([id, latestVideo]) => [id, latestVideo]),
)

for (const [, , videos] of latestEntries) {
  videoCache = mergeVideoCache(videoCache, videos)
}

if (refreshTopVideos) {
  for (const channel of channels) {
    const { videos, topVideoIds } = await fetchTopVideos(channel, videoCache)
    if (videos.length > 0) videoCache = mergeVideoCache(videoCache, videos)
    if (topVideoIds.length > 0 && latestVideos[channel.id]) {
      latestVideos[channel.id] = {
        ...latestVideos[channel.id],
        topVideoIds,
        topVideosUpdatedAt: new Date().toISOString(),
      }
    }
  }
}

await writeFile(latestOutputPath, `${JSON.stringify(latestVideos, null, 2)}\n`)
await writeFile(videoCachePath, `${JSON.stringify(videoCache, null, 2)}\n`)

for (const channel of channels) {
  const latestVideoId = latestVideos[channel.id]?.latestVideoId
  if (latestVideoId) {
    console.log(`${channel.name}: ${videoCache[latestVideoId]?.title}`)
  }
}
