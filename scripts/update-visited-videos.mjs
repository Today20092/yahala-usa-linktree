import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { parse } from 'yaml'

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

const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

const readExistingAssignments = async () => {
  try {
    const existingYaml = await readFile(outputPath, 'utf8')
    const parsed = parse(existingYaml)
    return Array.isArray(parsed?.videos) ? parsed.videos : []
  } catch {
    return []
  }
}

const fetchChannelVideos = async () => {
  try {
    const result = await execFileAsync('yt-dlp', [
      '--dump-json',
      '--flat-playlist',
      channelVideosUrl,
    ])

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
        published: video.upload_date
          ? `${video.upload_date.slice(0, 4)}-${video.upload_date.slice(4, 6)}-${video.upload_date.slice(6, 8)}`
          : '',
      }))
  } catch (error) {
    console.warn(`Unable to fetch Ya Hala videos with yt-dlp: ${error.message}`)
    return []
  }
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

const existingAssignments = await readExistingAssignments()
let videoCache = await readJson(videoCachePath, {})
const existingByKey = new Map(
  existingAssignments
    .map((assignment) => [assignmentKey(assignment), assignment])
    .filter(([key]) => key),
)

const fetchedVideos = await fetchChannelVideos()
const fetchedByKey = new Map(
  fetchedVideos
    .map((video) => [`youtube:${video.videoId}`, video])
    .filter(([key]) => key),
)
const allKeys = [...new Set([...fetchedByKey.keys(), ...existingByKey.keys()])]

const mergedAssignments = allKeys.map((key) => {
  const fetchedVideo = fetchedByKey.get(key)
  const existingAssignment = existingByKey.get(key)
  const videoId =
    fetchedVideo?.videoId ??
    existingAssignment?.videoId ??
    getYoutubeVideoId(existingAssignment?.url)

  return {
    videoId,
    state: existingAssignment?.state ?? '',
    city: existingAssignment?.city ?? '',
  }
})

const cacheVideos = mergedAssignments.map((assignment) => {
  const fetchedVideo = fetchedByKey.get(`youtube:${assignment.videoId}`)
  return normalizeVideoMetadata(
    fetchedVideo ?? { videoId: assignment.videoId },
    videoCache[assignment.videoId],
  )
})

videoCache = mergeVideoCache(videoCache, cacheVideos)

await writeFile(outputPath, serializeAssignments(mergedAssignments))
await writeFile(videoCachePath, `${JSON.stringify(videoCache, null, 2)}\n`)

console.log(`Updated ${mergedAssignments.length} visited video assignments.`)
