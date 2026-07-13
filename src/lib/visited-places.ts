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

const stateAbbreviations: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

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

const maxVideosPerGroup = 3

const buildVisitedPlacePresentation = (
  places: VisitedPlace[],
  stateVideos: VisitedPlaces['stateVideos'] = [],
) => {
  const videosByState = new Map(
    stateVideos.map((group) => [
      normalizeText(group.state),
      group.videos ?? [],
    ]),
  )
  const groups = new Map<
    string,
    NonNullable<VisitedPlaces['stateGroups']>[number]
  >()

  places.forEach((place, firstIndex) => {
    const stateKey = normalizeText(place.state)
    const group = groups.get(stateKey) ?? {
      state: place.state,
      abbreviation: place.stateAbbreviation ?? place.state,
      places: [],
      stateVideos: (videosByState.get(stateKey) ?? []).slice(
        0,
        maxVideosPerGroup,
      ),
      videoCount: videosByState.get(stateKey)?.length ?? 0,
      firstIndex,
    }

    group.places.push({
      ...place,
      videos: place.videos?.slice(0, maxVideosPerGroup),
    })
    group.videoCount += place.videos?.length ?? 0
    groups.set(stateKey, group)
  })

  return {
    stateGroups: [...groups.values()].sort(
      (a, b) => b.videoCount - a.videoCount || a.firstIndex - b.firstIndex,
    ),
    mapPlaces: places
      .filter(
        (place) =>
          (place.videos?.length ?? 0) > 0 &&
          typeof place.latitude === 'number' &&
          typeof place.longitude === 'number',
      )
      .map((place) => ({
        city: place.city,
        state: place.state,
        label: place.label ?? `${place.city}, ${place.state}`,
        latitude: place.latitude as number,
        longitude: place.longitude as number,
      })),
  }
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
      label: `${place.city}, ${stateAbbreviations[place.state] ?? place.state}`,
      stateAbbreviation: stateAbbreviations[place.state] ?? place.state,
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

      const displayState =
        visitedPlaces.stateVideos?.find(
          (group) => normalizeText(group.state) === state,
        )?.state ??
        visitedPlaces.places?.find(
          (place) => normalizeText(place.state) === state,
        )?.state ??
        state
      return {
        state: displayState,
        label: displayState,
        abbreviation: stateAbbreviations[displayState] ?? displayState,
        videos: resolvedVideos,
      }
    })
    .filter((group) => group.videos.length > 0)

  const presentation = buildVisitedPlacePresentation(places, stateVideos)

  return {
    ...visitedPlaces,
    stateVideos,
    places,
    ...presentation,
  }
}
