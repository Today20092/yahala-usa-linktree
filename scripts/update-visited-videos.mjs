import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { parse } from 'yaml'

const channelVideosUrl = 'https://www.youtube.com/@YaHalaUSA/videos'
const outputPath = new URL('../src/data/visited-videos.yaml', import.meta.url)

const getYoutubeVideoId = (url) => {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname.includes('youtu.be')) {
      return parsedUrl.pathname.split('/').filter(Boolean)[0]
    }

    if (parsedUrl.searchParams.has('v')) {
      return parsedUrl.searchParams.get('v')
    }

    return parsedUrl.pathname.match(/\/embed\/([^/?]+)/)?.[1] ?? null
  } catch {
    return null
  }
}

const videoKey = (url) => getYoutubeVideoId(url) ?? url

const readExistingVideos = async () => {
  if (!existsSync(outputPath)) return []

  const existingYaml = await readFile(outputPath, 'utf8')
  const parsed = parse(existingYaml)

  return Array.isArray(parsed?.videos) ? parsed.videos : []
}

const fetchChannelVideos = () => {
  const result = spawnSync(
    'yt-dlp',
    ['--flat-playlist', '--dump-json', channelVideosUrl],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 80,
      timeout: 300000,
    },
  )

  if (result.status !== 0) {
    throw new Error(
      `yt-dlp failed while fetching Ya Hala videos:\n${result.stderr}`,
    )
  }

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((video) => video?.id)
    .map((video) => ({
      url: `https://www.youtube.com/watch?v=${video.id}`,
    }))
}

const yamlString = (value) => {
  if (!value) return '""'

  return JSON.stringify(String(value))
}

const serializeVideos = (videos) => {
  const lines = [
    '# Assign videos by filling state and optional city.',
    '# State-only videos appear in every visited city for that state.',
    '# City videos appear only in the matching city drawer.',
    'videos:',
  ]

  for (const video of videos) {
    lines.push(`  - url: ${video.url}`)
    lines.push(`    state: ${yamlString(video.state)}`)
    lines.push(`    city: ${yamlString(video.city)}`)
  }

  return `${lines.join('\n')}\n`
}

const existingVideos = await readExistingVideos()
const existingByKey = new Map(
  existingVideos
    .filter((video) => video?.url)
    .map((video) => [videoKey(video.url), video]),
)
const fetchedVideos = fetchChannelVideos()
const fetchedKeys = new Set()

const mergedVideos = fetchedVideos.map((video) => {
  const key = videoKey(video.url)
  fetchedKeys.add(key)

  const existingVideo = existingByKey.get(key)

  return {
    ...existingVideo,
    url: video.url,
    state: existingVideo?.state ?? '',
    city: existingVideo?.city ?? '',
  }
})

for (const existingVideo of existingVideos) {
  if (!existingVideo?.url) continue

  const key = videoKey(existingVideo.url)
  if (!fetchedKeys.has(key)) {
    mergedVideos.push(existingVideo)
  }
}

await writeFile(outputPath, serializeVideos(mergedVideos))

console.log(`Updated ${mergedVideos.length} visited video URLs.`)
