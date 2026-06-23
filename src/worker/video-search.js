import youtubeVideos from '../data/youtube-videos.json' with { type: 'json' }

const CHANNEL_ID = 'UC26OIuJ19EH6HF6uRJ-N_2A'
const EMBEDDING_MODEL = '@cf/baai/bge-m3'
const MANIFEST_PREFIX = 'manifests/'
const TRANSCRIPT_PREFIX = 'transcripts/'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'
const ELIGIBLE_CATALOG = youtubeVideos

class YouTubeQuotaError extends Error {
  constructor(message) {
    super(message)
    this.name = 'YouTubeQuotaError'
  }
}

const getCatalogVideo = (videoId) => {
  const video = ELIGIBLE_CATALOG[videoId]
  return video?.channelId === CHANNEL_ID && video?.isShort === false
    ? video
    : null
}

const listCatalogVideoIds = () =>
  Object.values(ELIGIBLE_CATALOG)
    .filter(
      (video) =>
        video?.channelId === CHANNEL_ID &&
        video?.isShort === false &&
        /^[\w-]{11}$/.test(video.videoId),
    )
    .map((video) => video.videoId)

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...init.headers,
    },
  })

const youtubeUrl = (videoId, seconds = 0) =>
  `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(seconds))}s`

const getAccessToken = async (env) => {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_REFRESH_TOKEN
  ) {
    throw new Error('Google OAuth secrets are not configured')
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.access_token) {
    throw new Error(
      `Google OAuth refresh failed: ${payload.error ?? response.status}`,
    )
  }
  return payload.access_token
}

const youtubeFetch = async (path, token, params = {}) => {
  const url = new URL(`${YOUTUBE_API}/${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '')
      url.searchParams.set(key, String(value))
  })
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  })
  const payload = await response.json()
  if (!response.ok) {
    const message = payload.error?.message ?? String(response.status)
    const reasons =
      payload.error?.errors
        ?.map((error) => error.reason)
        .filter(Boolean) ?? []

    if (
      response.status === 403 &&
      (message.toLowerCase().includes('quota') ||
        reasons.some((reason) => reason.toLowerCase().includes('quota')))
    ) {
      throw new YouTubeQuotaError(`YouTube ${path} failed: ${message}`)
    }

    throw new Error(`YouTube ${path} failed: ${message}`)
  }
  return payload
}

const getUploadsPlaylistId = async (token) => {
  const payload = await youtubeFetch('channels', token, {
    part: 'contentDetails',
    id: CHANNEL_ID,
  })
  return payload.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? ''
}

const listUploadIds = async (token, maxVideos) => {
  const playlistId = await getUploadsPlaylistId(token)
  if (!playlistId) throw new Error('YouTube uploads playlist was not found')

  const ids = []
  let pageToken = ''
  do {
    const payload = await youtubeFetch('playlistItems', token, {
      part: 'contentDetails',
      playlistId,
      maxResults: 50,
      pageToken,
    })
    for (const item of payload.items ?? []) {
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId)
      if (maxVideos && ids.length >= maxVideos) return ids
    }
    pageToken = payload.nextPageToken ?? ''
  } while (pageToken)
  return ids
}

const getSourceDimensions = (fileDetails) => {
  const streams = [
    ...(fileDetails?.videoStreams ?? []),
    ...(fileDetails?.audioStreams ?? []),
  ].filter((stream) => stream.widthPixels && stream.heightPixels)
  if (!streams.length) return null
  return streams.sort(
    (a, b) => b.widthPixels * b.heightPixels - a.widthPixels * a.heightPixels,
  )[0]
}

const getVideo = async (videoId, token) => {
  const payload = await youtubeFetch('videos', token, {
    part: 'snippet,contentDetails,status,fileDetails',
    id: videoId,
  })
  return payload.items?.[0] ?? null
}

const chooseCaption = (captions = []) => {
  const ranked = captions
    .filter((caption) => caption.snippet?.status !== 'failed')
    .map((caption) => {
      const language = caption.snippet?.language ?? ''
      const preferredLanguage =
        language === 'ar' ? 0 : language === 'en' ? 1 : 2
      const autoPenalty = caption.snippet?.trackKind === 'ASR' ? 2 : 0
      return { caption, rank: preferredLanguage + autoPenalty }
    })
    .sort((a, b) => a.rank - b.rank)
  return ranked[0]?.caption ?? null
}

const getCaption = async (videoId, token) => {
  const payload = await youtubeFetch('captions', token, {
    part: 'snippet',
    videoId,
  })
  return chooseCaption(payload.items)
}

const parseTimestamp = (value) => {
  const match = value.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})/)
  if (!match) return null
  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3]) +
    Number(match[4]) / 1000
  )
}

export const parseTimedText = (source) => {
  const normalized = source.replace(/\r/g, '').replace(/^WEBVTT[^\n]*\n+/, '')
  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n').filter(Boolean)
      const timingIndex = lines.findIndex((line) => line.includes('-->'))
      if (timingIndex < 0) return null
      const [startText, endText] = lines[timingIndex].split('-->')
      const start = parseTimestamp(startText)
      const end = parseTimestamp(endText)
      const text = lines
        .slice(timingIndex + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      return start === null || end === null || !text
        ? null
        : { start, end, text }
    })
    .filter(Boolean)
}

const downloadCaption = async (captionId, token) => {
  const url = new URL(`${YOUTUBE_API}/captions/${captionId}`)
  url.searchParams.set('tfmt', 'vtt')
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Caption download failed: ${response.status}`)
  }
  return response.text()
}

export const chunkTranscript = (
  events,
  targetSeconds = 45,
  overlapSeconds = 10,
) => {
  if (!events.length) return []
  const chunks = []
  let startIndex = 0

  while (startIndex < events.length) {
    const start = events[startIndex].start
    let endIndex = startIndex
    while (
      endIndex + 1 < events.length &&
      events[endIndex].end - start < targetSeconds
    ) {
      endIndex += 1
    }

    const selected = events.slice(startIndex, endIndex + 1)
    chunks.push({
      start: selected[0].start,
      end: selected[selected.length - 1].end,
      text: selected.map((event) => event.text).join(' '),
    })

    const nextStart = selected[selected.length - 1].end - overlapSeconds
    let nextIndex = endIndex
    while (nextIndex > startIndex + 1 && events[nextIndex].start > nextStart) {
      nextIndex -= 1
    }
    startIndex = Math.max(startIndex + 1, nextIndex)
  }
  return chunks
}

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const manifestKey = (videoId) => `${MANIFEST_PREFIX}${videoId}.json`

const readManifest = async (env, videoId) => {
  const object = await env.TRANSCRIPTS_R2.get(manifestKey(videoId))
  return object ? object.json() : null
}

const writeManifest = (env, videoId, manifest) =>
  env.TRANSCRIPTS_R2.put(manifestKey(videoId), JSON.stringify(manifest), {
    httpMetadata: { contentType: 'application/json' },
  })

const skipVideo = async (env, videoId, reason, extra = {}) => {
  await writeManifest(env, videoId, {
    videoId,
    channelId: CHANNEL_ID,
    status: 'skipped',
    reason,
    checkedAt: new Date().toISOString(),
    ...extra,
  })
  return { videoId, status: 'skipped', reason }
}

export const deferVideo = async (env, videoId, reason, extra = {}) => {
  await writeManifest(env, videoId, {
    videoId,
    channelId: CHANNEL_ID,
    status: 'pending',
    reason,
    checkedAt: new Date().toISOString(),
    ...extra,
  })
  return { videoId, status: 'pending', reason }
}

export const isYouTubeQuotaError = (error) =>
  error instanceof YouTubeQuotaError ||
  String(error?.message ?? error)
    .toLowerCase()
    .includes('quota')

const isQueueQuotaError = (error) =>
  String(error?.message ?? error)
    .toLowerCase()
    .includes('daily write operations limit')

const embedTexts = async (env, texts) => {
  const response = await env.AI.run(EMBEDDING_MODEL, { text: texts })
  const vectors = response?.data ?? response?.embeddings ?? response
  if (!Array.isArray(vectors)) throw new Error('Unexpected embedding response')
  return vectors
}

export const processVideo = async (env, videoId) => {
  const token = await getAccessToken(env)
  const video = await getVideo(videoId, token)
  if (!video) return skipVideo(env, videoId, 'video-not-found')
  if (video.snippet?.channelId !== CHANNEL_ID) {
    return skipVideo(env, videoId, 'wrong-channel')
  }
  if (video.status?.privacyStatus !== 'public') {
    return skipVideo(env, videoId, 'not-public')
  }

  const catalogVideo = getCatalogVideo(videoId)
  const dimensions = getSourceDimensions(video.fileDetails)
  if (
    dimensions &&
    dimensions.widthPixels <= dimensions.heightPixels
  ) {
    return skipVideo(env, videoId, 'not-landscape', {
      width: dimensions.widthPixels,
      height: dimensions.heightPixels,
    })
  }
  if (!dimensions && !catalogVideo) {
    return skipVideo(env, videoId, 'not-in-landscape-catalog')
  }

  const caption = await getCaption(videoId, token)
  if (!caption) return skipVideo(env, videoId, 'captions-unavailable')

  const captionSource = await downloadCaption(caption.id, token)
  const events = parseTimedText(captionSource)
  if (!events.length) return skipVideo(env, videoId, 'empty-captions')

  const checksum = await sha256(captionSource)
  const previous = await readManifest(env, videoId)
  if (
    previous?.status === 'indexed' &&
    previous.checksum === checksum &&
    previous.embeddingModel === EMBEDDING_MODEL
  ) {
    return { videoId, status: 'unchanged' }
  }

  const language = caption.snippet?.language ?? ''
  const title = video.snippet?.title ?? 'Ya Hala video'
  const chunks = chunkTranscript(events)
  const transcript = {
    videoId,
    channelId: CHANNEL_ID,
    title,
    thumbnail: video.snippet?.thumbnails?.high?.url ?? '',
    published: video.snippet?.publishedAt ?? '',
    duration: video.contentDetails?.duration ?? '',
    language,
    width: dimensions?.widthPixels ?? null,
    height: dimensions?.heightPixels ?? null,
    landscapeEligibility: dimensions ? 'source-dimensions' : 'catalog',
    events,
  }
  await env.TRANSCRIPTS_R2.put(
    `${TRANSCRIPT_PREFIX}${videoId}.json`,
    JSON.stringify(transcript),
    { httpMetadata: { contentType: 'application/json' } },
  )

  const batchSize = 50
  for (let index = 0; index < chunks.length; index += batchSize) {
    const batch = chunks.slice(index, index + batchSize)
    const embeddingInput = batch.map(
      (chunk) => `${title}\n${video.snippet?.description ?? ''}\n${chunk.text}`,
    )
    const embeddings = await embedTexts(env, embeddingInput)
    await env.VECTORIZE.upsert(
      batch.map((chunk, offset) => ({
        id: `${videoId}:${Math.floor(chunk.start)}`,
        values: embeddings[offset],
        metadata: {
          videoId,
          channelId: CHANNEL_ID,
          title,
          thumbnail: transcript.thumbnail,
          excerpt: chunk.text.slice(0, 1800),
          language,
          startSeconds: chunk.start,
          endSeconds: chunk.end,
          duration: transcript.duration,
          published: transcript.published,
          landscape: true,
        },
      })),
    )
  }

  await writeManifest(env, videoId, {
    videoId,
    channelId: CHANNEL_ID,
    status: 'indexed',
    checksum,
    captionId: caption.id,
    language,
    chunkCount: chunks.length,
    landscapeEligibility: transcript.landscapeEligibility,
    embeddingModel: EMBEDDING_MODEL,
    indexedAt: new Date().toISOString(),
  })
  return { videoId, status: 'indexed', chunkCount: chunks.length }
}

const enqueueSync = async (env, maxVideos) => {
  const videoIds = listCatalogVideoIds().slice(
    0,
    maxVideos || Number.POSITIVE_INFINITY,
  )
  let queued = 0
  let queueWriteLimitReached = false
  for (const videoId of videoIds) {
    const manifest = await readManifest(env, videoId)
    if (
      manifest?.status === 'indexed' &&
      manifest.embeddingModel === EMBEDDING_MODEL
    ) {
      continue
    }
    try {
      await env.VIDEO_INDEX_QUEUE.send({ videoId })
    } catch (error) {
      if (!isQueueQuotaError(error)) throw error
      queueWriteLimitReached = true
      break
    }
    queued += 1
  }
  return { discovered: videoIds.length, queued, queueWriteLimitReached }
}

const rateLimit = async (request) => {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const bucket = Math.floor(Date.now() / 60_000)
  const key = new Request(`https://rate-limit.invalid/${ip}/${bucket}`)
  const cache = caches.default
  const existing = await cache.match(key)
  const count = Number(existing?.headers.get('x-count') ?? 0) + 1
  await cache.put(
    key,
    new Response('', {
      headers: { 'x-count': String(count), 'cache-control': 'max-age=60' },
    }),
  )
  return count <= 30
}

export const handleSearch = async (request, env) => {
  if (!(await rateLimit(request))) {
    return json(
      { error: 'Too many searches. Please try again shortly.' },
      { status: 429 },
    )
  }
  const url = new URL(request.url)
  const query = (url.searchParams.get('q') ?? '').trim()
  const limit = Math.min(
    10,
    Math.max(1, Number(url.searchParams.get('limit')) || 6),
  )
  if (query.length < 2 || query.length > 200) {
    return json(
      { error: 'Query must contain between 2 and 200 characters.' },
      { status: 400 },
    )
  }

  const cacheKey = new Request(
    `${url.origin}/__video-search-cache?${new URLSearchParams({
      q: query.toLocaleLowerCase(),
      limit: String(limit),
    })}`,
  )
  const cached = await caches.default.match(cacheKey)
  if (cached) return cached

  const [queryVector] = await embedTexts(env, [query])
  const matches = await env.VECTORIZE.query(queryVector, {
    topK: Math.min(50, limit * 6),
    returnMetadata: 'all',
    filter: { landscape: true, channelId: CHANNEL_ID },
  })

  const bestByVideo = new Map()
  for (const match of matches.matches ?? []) {
    const metadata = match.metadata ?? {}
    if (!metadata.videoId) continue
    const previous = bestByVideo.get(metadata.videoId)
    if (!previous || match.score > previous.score) {
      bestByVideo.set(metadata.videoId, { ...metadata, score: match.score })
    }
  }

  const results = [...bestByVideo.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => ({
      ...result,
      url: youtubeUrl(result.videoId, result.startSeconds),
    }))
  const response = json(
    { query, results },
    { headers: { 'cache-control': 'public, max-age=60' } },
  )
  await caches.default.put(cacheKey, response.clone())
  return response
}

const isAdminRequest = (request, env) =>
  Boolean(
    env.ADMIN_API_TOKEN &&
      request.headers.get('authorization') === `Bearer ${env.ADMIN_API_TOKEN}`,
  )

export const handleAdminStatus = async (request, env) => {
  if (!isAdminRequest(request, env)) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const videos = listCatalogVideoIds()
  const records = []
  for (let index = 0; index < videos.length; index += 25) {
    const batch = videos.slice(index, index + 25)
    const manifests = await Promise.all(
      batch.map((videoId) => readManifest(env, videoId)),
    )
    batch.forEach((videoId, offset) => {
      const catalog = getCatalogVideo(videoId)
      const manifest = manifests[offset]
      records.push({
        videoId,
        title: catalog?.title ?? videoId,
        status: manifest?.status ?? 'pending',
        reason: manifest?.reason ?? null,
        chunkCount: manifest?.chunkCount ?? 0,
        language: manifest?.language ?? null,
      })
    })
  }

  const counts = records.reduce(
    (result, record) => {
      result[record.status] = (result[record.status] ?? 0) + 1
      if (record.reason) {
        result.reasons[record.reason] =
          (result.reasons[record.reason] ?? 0) + 1
      }
      result.chunks += record.chunkCount
      return result
    },
    { total: records.length, indexed: 0, skipped: 0, pending: 0, chunks: 0, reasons: {} },
  )

  return json({
    counts,
    missingTranscripts: records.filter(
      (record) => record.status !== 'indexed',
    ),
  })
}

export const handleAdminReindex = async (request, env) => {
  if (!isAdminRequest(request, env)) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(request.url)
  const videoId = url.searchParams.get('videoId')
  if (videoId && /^[\w-]{11}$/.test(videoId)) {
    try {
      await env.VIDEO_INDEX_QUEUE.send({ videoId })
      return json({ queued: 1, videoId }, { status: 202 })
    } catch (error) {
      if (!isQueueQuotaError(error)) throw error
      return json(
        {
          queued: 0,
          videoId,
          queueWriteLimitReached: true,
          message:
            'Cloudflare Queue write quota is exhausted. Daily Cron will resume indexing after the quota resets.',
        },
        { status: 202 },
      )
    }
  }
  const maxVideos = Math.min(
    500,
    Math.max(0, Number(url.searchParams.get('max')) || 0),
  )
  return json(await enqueueSync(env, maxVideos), { status: 202 })
}

export const runScheduledSync = (env) => enqueueSync(env, 0)
