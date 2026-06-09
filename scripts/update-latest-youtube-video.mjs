import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'yaml'

import {
  entriesFromFeed,
  mergeVideoCache,
  normalizeVideoMetadata,
  uniqueVideos,
  videosFromVideosTab,
  videosWithFallbackThumbnails,
} from './youtube-video-utils.mjs'

const siteConfigPath = new URL('../src/data/site.yaml', import.meta.url)
const latestOutputPath = new URL(
  '../src/data/latest-youtube-videos.json',
  import.meta.url,
)
const videoCachePath = new URL('../src/data/youtube-videos.json', import.meta.url)

const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
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
  const oldVideos = [
    channelLatest,
    ...(channelLatest?.videos ?? []),
  ].filter((video) => video?.videoId)
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

await writeFile(latestOutputPath, `${JSON.stringify(latestVideos, null, 2)}\n`)
await writeFile(videoCachePath, `${JSON.stringify(videoCache, null, 2)}\n`)

for (const channel of channels) {
  const latestVideoId = latestVideos[channel.id]?.latestVideoId
  if (latestVideoId) {
    console.log(`${channel.name}: ${videoCache[latestVideoId]?.title}`)
  }
}
