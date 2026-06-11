import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { parse } from 'yaml'

import { inferLocationForVideo, isConfidentNewPlace } from './location-utils.mjs'
import {
  addVisitedPlaces,
  getVisitedPlaceKeys,
  readSiteConfig,
  visitedPlaceKey,
  writeSiteConfig,
} from './site-places-utils.mjs'
import {
  getYoutubeVideoId,
  mergeVideoCache,
  normalizeVideoMetadata,
  youtubeWatchUrl,
} from './youtube-video-utils.mjs'

const execFileAsync = promisify(execFile)
const channelVideosUrl = 'https://www.youtube.com/@YaHalaUSA/videos'
const outputPath = new URL('../src/data/visited-videos.yaml', import.meta.url)
const videoCachePath = new URL('../src/data/youtube-videos.json', import.meta.url)
const geocodeCachePath = new URL(
  '../src/data/geocoded-locations.json',
  import.meta.url,
)
const latestPath = new URL('../src/data/latest-youtube-videos.json', import.meta.url)
const refreshDescriptions = process.argv.includes('--refresh-descriptions')
const youtubeRequestDelayMs = Number(
  process.env.YOUTUBE_REQUEST_DELAY_MS ?? 1500,
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitBetweenYoutubeRequests = async () => {
  if (youtubeRequestDelayMs > 0) await sleep(youtubeRequestDelayMs)
}

const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

const readYaml = async (path, fallback) => {
  try {
    return parse(await readFile(path, 'utf8')) ?? fallback
  } catch {
    return fallback
  }
}

const readExistingAssignments = async () => {
  const parsed = await readYaml(outputPath, {})
  return Array.isArray(parsed?.videos) ? parsed.videos : []
}

const fetchPlaylistVideos = async () => {
  try {
    await waitBetweenYoutubeRequests()
    const result = await execFileAsync(
      'yt-dlp',
      ['--dump-json', '--flat-playlist', channelVideosUrl],
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
      }))
  } catch (error) {
    console.warn(`Unable to fetch Ya Hala playlist with yt-dlp: ${error.message}`)
    return []
  }
}

const ytdlpDate = (value) =>
  value && /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : ''

const fetchFullVideoMetadata = async (videoId) => {
  try {
    await waitBetweenYoutubeRequests()
    const result = await execFileAsync(
      'yt-dlp',
      ['--dump-single-json', '--skip-download', youtubeWatchUrl(videoId)],
      { maxBuffer: 1024 * 1024 * 32 },
    )
    const video = JSON.parse(result.stdout)

    return {
      videoId,
      url: youtubeWatchUrl(videoId),
      title: video.title,
      thumbnail: video.thumbnail,
      duration: video.duration_string ?? '',
      published: ytdlpDate(video.upload_date),
      updated: ytdlpDate(video.upload_date),
      description: video.description ?? '',
      tags: video.tags ?? [],
      categories: video.categories ?? [],
      fullMetadataFetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.warn(`Unable to fetch full metadata for ${videoId}: ${error.message}`)
    return null
  }
}

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

const yamlString = (value) => {
  if (value === null || value === undefined || value === '') return '""'
  return JSON.stringify(String(value))
}

const assignmentKey = (assignment) => {
  const videoId = assignment.videoId ?? getYoutubeVideoId(assignment.url)
  return videoId ? `youtube:${videoId}` : ''
}

const serializeAssignments = (assignments) => {
  const lines = [
    '# Assign videos by filling state and optional city.',
    '# State-only videos appear in every visited city for that state.',
    '# City videos appear only in the matching city drawer.',
    'videos:',
  ]

  for (const assignment of assignments) {
    lines.push(`  - videoId: ${assignment.videoId}`)
    lines.push(`    state: ${yamlString(assignment.state)}`)
    lines.push(`    city: ${yamlString(assignment.city)}`)
  }

  return `${lines.join('\n')}\n`
}

const siteConfig = await readSiteConfig()
let places = siteConfig.visitedPlaces?.places ?? []
const latestVideos = await readJson(latestPath, {})
const latestVideoIds = new Set(
  Object.values(latestVideos)
    .flatMap((latest) => [latest.latestVideoId, latest.videoId])
    .filter(Boolean),
)
const existingAssignments = await readExistingAssignments()
let videoCache = await readJson(videoCachePath, {})
let geocodeCache = await readJson(geocodeCachePath, {})

const existingByKey = new Map(
  existingAssignments
    .map((assignment) => [assignmentKey(assignment), assignment])
    .filter(([key]) => key),
)

const playlistVideos = await fetchPlaylistVideos()
const playlistByKey = new Map(
  playlistVideos
    .map((video) => [`youtube:${video.videoId}`, video])
    .filter(([key]) => key),
)
const allKeys = [...new Set([...playlistByKey.keys(), ...existingByKey.keys()])]

const needsFullMetadata = (videoId) => {
  const cachedVideo = videoCache[videoId]
  return (
    refreshDescriptions ||
    latestVideoIds.has(videoId) ||
    !cachedVideo?.description ||
    !cachedVideo?.locationHints
  )
}

const videosNeedingFullMetadata = allKeys
  .map((key) => key.replace(/^youtube:/, ''))
  .filter((videoId) => videoId && needsFullMetadata(videoId))

console.log(`Fetching full metadata for ${videosNeedingFullMetadata.length} videos.`)

const fullMetadataVideos = (
  await mapLimit(videosNeedingFullMetadata, 1, fetchFullVideoMetadata)
).filter(Boolean)

videoCache = mergeVideoCache(videoCache, playlistVideos)
videoCache = mergeVideoCache(videoCache, fullMetadataVideos)

const processedVideos = []
const newPlacesToAdd = []
const knownPlaceKeys = getVisitedPlaceKeys(siteConfig)
const pendingPlaceKeys = new Set()

for (const key of allKeys) {
  const playlistVideo = playlistByKey.get(key)
  const existingAssignment = existingByKey.get(key)
  const videoId =
    playlistVideo?.videoId ??
    existingAssignment?.videoId ??
    getYoutubeVideoId(existingAssignment?.url)
  if (!videoId) continue

  const cachedVideo = normalizeVideoMetadata(
    playlistVideo ?? { videoId },
    videoCache[videoId],
  )
  const locationHints = cachedVideo.description
    ? await inferLocationForVideo({
        title: cachedVideo.title,
        description: cachedVideo.description,
        places,
        geocodeCache,
      })
    : cachedVideo.locationHints

  const nextCachedVideo = {
    ...cachedVideo,
    locationHints: locationHints ?? cachedVideo.locationHints,
  }
  videoCache = mergeVideoCache(videoCache, [nextCachedVideo])

  if (isConfidentNewPlace(locationHints)) {
    const place = {
      city: locationHints.city,
      state: locationHints.state,
      latitude: Number(locationHints.latitude),
      longitude: Number(locationHints.longitude),
    }
    const key = visitedPlaceKey(place)
    if (!knownPlaceKeys.has(key) && !pendingPlaceKeys.has(key)) {
      pendingPlaceKeys.add(key)
      newPlacesToAdd.push(place)
    }
  }

  processedVideos.push({
    videoId,
    locationHints,
    existingAssignment,
  })
}

const addedPlaces = addVisitedPlaces(siteConfig, newPlacesToAdd)
if (addedPlaces.length > 0) {
  await writeSiteConfig(siteConfig)
  places = siteConfig.visitedPlaces?.places ?? []
  console.log(`Added ${addedPlaces.length} new visited places to site.yaml.`)
}

const updatedPlaceKeys = new Set(places.map(visitedPlaceKey))
const mergedAssignments = processedVideos.map(
  ({ videoId, locationHints, existingAssignment }) => {
    const existingState = String(existingAssignment?.state ?? '').trim()
    const existingCity = String(existingAssignment?.city ?? '').trim()
    if (existingState || existingCity) {
      return {
        videoId,
        state: existingState,
        city: existingCity,
      }
    }

    const hintedPlaceKey = visitedPlaceKey(locationHints)
    const canUseHintedCity = locationHints?.city
      ? updatedPlaceKeys.has(hintedPlaceKey)
      : Boolean(locationHints?.state)

    return {
      videoId,
      state:
        canUseHintedCity || locationHints?.state
          ? locationHints?.state ?? ''
          : existingAssignment?.state ?? '',
      city: canUseHintedCity
        ? locationHints?.city ?? ''
        : existingAssignment?.city ?? '',
    }
  },
)

await writeFile(outputPath, serializeAssignments(mergedAssignments))
await writeFile(videoCachePath, `${JSON.stringify(videoCache, null, 2)}\n`)
await writeFile(geocodeCachePath, `${JSON.stringify(geocodeCache, null, 2)}\n`)

console.log(`Updated ${mergedAssignments.length} visited video assignments.`)
