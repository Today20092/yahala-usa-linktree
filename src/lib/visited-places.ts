import { parse } from 'yaml'

import visitedVideosYaml from '../data/visited-videos.yaml?raw'
import type { CityVideo, VisitedPlace, VisitedPlaces } from './site-config'
import { getYoutubeVideoId, resolveYoutubeVideo } from './youtube-videos'

type VisitedVideoAssignment = CityVideo & {
  state?: string | null
  city?: string | null
}

const visitedVideoCatalog = parse(visitedVideosYaml) as {
  videos?: VisitedVideoAssignment[]
}

const normalizeText = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

const videoKey = (video: CityVideo) =>
  video.videoId ?? getYoutubeVideoId(video.url) ?? video.url ?? ''

const dedupeVideos = (videos: CityVideo[]) => {
  const seen = new Set<string>()

  return videos.filter((video) => {
    const key = videoKey(video)
    if (!key || seen.has(key)) return false

    seen.add(key)
    return true
  })
}

const addVideoToMap = (
  map: Map<string, CityVideo[]>,
  key: string,
  video: CityVideo,
) => {
  const videos = map.get(key) ?? []
  videos.push(video)
  map.set(key, videos)
}

export const resolveVisitedPlaces = (
  visitedPlaces: VisitedPlaces,
): VisitedPlaces => {
  const videosByState = new Map<string, CityVideo[]>()
  const videosByPlace = new Map<string, CityVideo[]>()

  for (const group of visitedPlaces.stateVideos ?? []) {
    videosByState.set(normalizeText(group.state), group.videos ?? [])
  }

  for (const assignment of visitedVideoCatalog.videos ?? []) {
    const state = normalizeText(assignment.state)
    if (!state) continue

    const city = normalizeText(assignment.city)
    const video = {
      videoId: assignment.videoId,
      url: assignment.url,
      title: assignment.title,
      thumbnail: assignment.thumbnail,
    }

    if (city) {
      addVideoToMap(videosByPlace, `${state}:${city}`, video)
    } else {
      addVideoToMap(videosByState, state, video)
    }
  }

  const cityVideoKeys = new Set<string>()
  const places: VisitedPlace[] = (visitedPlaces.places ?? []).map((place) => {
    const state = normalizeText(place.state)
    const city = normalizeText(place.city)
    const mergedVideos = dedupeVideos([
      ...(videosByPlace.get(`${state}:${city}`) ?? []),
      ...(place.videos ?? []),
    ])
    const videos = mergedVideos
      .map((video) => resolveYoutubeVideo(video))
      .filter(Boolean)

    videos.forEach((video) => {
      const key = videoKey(video)
      if (key) cityVideoKeys.add(key)
    })

    return {
      ...place,
      videos: videos.length > 0 ? videos : undefined,
    }
  })
  const stateVideos = [...videosByState.entries()]
    .map(([state, videos]) => {
      const resolvedVideos = dedupeVideos(videos)
        .filter((video) => {
          const key = videoKey(video)
          return key && !cityVideoKeys.has(key)
        })
        .map((video) => resolveYoutubeVideo(video))
        .filter(Boolean)

      return {
        state:
          visitedPlaces.stateVideos?.find(
            (group) => normalizeText(group.state) === state,
          )?.state ??
          visitedPlaces.places?.find(
            (place) => normalizeText(place.state) === state,
          )?.state ??
          state,
        videos: resolvedVideos,
      }
    })
    .filter((group) => group.videos.length > 0)

  return {
    ...visitedPlaces,
    stateVideos,
    places,
  }
}
