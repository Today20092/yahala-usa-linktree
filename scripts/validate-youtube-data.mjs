import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'

import { getYoutubeVideoId } from './youtube-video-utils.mjs'

const latestPath = new URL(
  '../src/data/latest-youtube-videos.json',
  import.meta.url,
)
const videoCachePath = new URL(
  '../src/data/youtube-videos.json',
  import.meta.url,
)
const geocodeCachePath = new URL(
  '../src/data/geocoded-locations.json',
  import.meta.url,
)
const visitedPath = new URL('../src/data/visited-videos.yaml', import.meta.url)
const siteConfigPath = new URL('../src/data/site.yaml', import.meta.url)

const errors = []
const warnings = []

const readJson = async (path, label) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    errors.push(`${label} is not valid JSON: ${error.message}`)
    return {}
  }
}

const readYaml = async (path, label) => {
  try {
    return parse(await readFile(path, 'utf8')) ?? {}
  } catch (error) {
    errors.push(`${label} is not valid YAML: ${error.message}`)
    return {}
  }
}

const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const videoIdFromRef = (ref) => ref?.videoId ?? getYoutubeVideoId(ref?.url)

const latestVideos = await readJson(latestPath, 'latest-youtube-videos.json')
const youtubeVideos = await readJson(videoCachePath, 'youtube-videos.json')
await readJson(geocodeCachePath, 'geocoded-locations.json')
const visitedVideos = await readYaml(visitedPath, 'visited-videos.yaml')
const siteConfig = await readYaml(siteConfigPath, 'site.yaml')

for (const [channelId, latest] of Object.entries(latestVideos)) {
  const latestVideoId = latest?.latestVideoId ?? latest?.videoId
  if (!latestVideoId) {
    errors.push(`${channelId} is missing latestVideoId`)
  } else if (!youtubeVideos[latestVideoId]) {
    errors.push(
      `${channelId} latestVideoId ${latestVideoId} is missing from youtube-videos.json`,
    )
  }

  for (const videoId of latest?.videoIds ?? []) {
    if (!youtubeVideos[videoId]) {
      errors.push(
        `${channelId} videoId ${videoId} is missing from youtube-videos.json`,
      )
    }
  }

  for (const videoId of latest?.topVideoIds ?? []) {
    const video = youtubeVideos[videoId]
    if (!video) {
      errors.push(
        `${channelId} topVideoId ${videoId} is missing from youtube-videos.json`,
      )
    } else if (!Number.isFinite(Number(video.viewCount))) {
      errors.push(
        `${channelId} topVideoId ${videoId} is missing numeric viewCount`,
      )
    }
  }
}

const placeKeys = new Set(
  (siteConfig.visitedPlaces?.places ?? []).map(
    (place) => `${normalizeText(place.state)}:${normalizeText(place.city)}`,
  ),
)
const seenAssignments = new Set()
const stateKeys = new Set(
  (siteConfig.visitedPlaces?.places ?? []).map((place) =>
    normalizeText(place.state),
  ),
)

for (const [videoId, video] of Object.entries(youtubeVideos)) {
  if (video.fullMetadataFetchedAt && !video.description) {
    errors.push(`${videoId} has fullMetadataFetchedAt but no description`)
  }

  if (video.locationHints) {
    const state = normalizeText(video.locationHints.state)
    const city = normalizeText(video.locationHints.city)
    if (state && city && !placeKeys.has(`${state}:${city}`)) {
      errors.push(
        `${videoId} has locationHints for unknown place ${video.locationHints.state}/${video.locationHints.city}`,
      )
    }
    if (
      state &&
      city &&
      Number.isFinite(Number(video.locationHints.latitude)) &&
      Number.isFinite(Number(video.locationHints.longitude)) &&
      !placeKeys.has(`${state}:${city}`)
    ) {
      errors.push(
        `${videoId} has geocoded locationHints that do not map to a site.yaml place`,
      )
    }
    if (state && !city && !stateKeys.has(state)) {
      errors.push(
        `${videoId} has locationHints for unknown state ${video.locationHints.state}`,
      )
    }
  } else {
    warnings.push(`${videoId} has no detected location`)
  }
}

for (const assignment of visitedVideos.videos ?? []) {
  const videoId = videoIdFromRef(assignment)
  const state = normalizeText(assignment.state)
  const city = normalizeText(assignment.city)

  if (!videoId) {
    errors.push(`Visited assignment is missing videoId/url`)
    continue
  }

  if (!youtubeVideos[videoId]) {
    errors.push(`Visited video ${videoId} is missing from youtube-videos.json`)
  }

  const assignmentKey = `${videoId}:${state}:${city}`
  if (seenAssignments.has(assignmentKey)) {
    errors.push(`Duplicate visited assignment ${assignmentKey}`)
  }
  seenAssignments.add(assignmentKey)

  if (state && city && !placeKeys.has(`${state}:${city}`)) {
    errors.push(
      `Visited assignment ${videoId} references unknown place ${assignment.state}/${assignment.city}`,
    )
  }

  if (state && !city && !stateKeys.has(state)) {
    errors.push(
      `Visited assignment ${videoId} references unknown state ${assignment.state}`,
    )
  }

  if (state && !city && stateKeys.has(state)) {
    warnings.push(
      `Visited assignment ${videoId} is state-only for ${assignment.state}`,
    )
  }
}

for (const place of siteConfig.visitedPlaces?.places ?? []) {
  const latitude = Number(place.latitude)
  const longitude = Number(place.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    errors.push(
      `Visited place ${place.city}, ${place.state} is missing numeric latitude/longitude`,
    )
  }

  for (const video of place.videos ?? []) {
    const videoId = videoIdFromRef(video)
    if (!videoId) {
      errors.push(
        `Curated video for ${place.city}, ${place.state} is missing videoId/url`,
      )
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exit(1)
}

if (warnings.length > 0) {
  console.warn(warnings.map((warning) => `- ${warning}`).join('\n'))
}

console.log('YouTube data is valid.')
