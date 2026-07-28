import type { CityVideo, VisitedPlaces } from './site-config'
import { sortVideosByPublishedDate } from './video-recency.js'
import { youtubeVideosById } from './youtube-videos'

export type Story = CityVideo & {
  state: string
  city?: string
  location: string
}

export const storyBrowserHref = (state?: string, city?: string) => {
  const params = new URLSearchParams()
  if (state) params.set('state', state)
  if (state && city) params.set('city', city)
  const query = params.toString()
  return `/stories${query ? `?${query}` : ''}`
}

export const buildStories = (visitedPlaces: VisitedPlaces): Story[] => {
  const locatedStories = (visitedPlaces.stateGroups ?? []).flatMap((group) => [
    ...group.stateVideos.map((video) => ({
      ...video,
      state: group.state,
      location: group.state,
    })),
    ...group.places.flatMap((place) =>
      (place.videos ?? []).map((video) => ({
        ...video,
        state: group.state,
        city: place.city,
        location: place.label ?? `${place.city}, ${group.abbreviation}`,
      })),
    ),
  ])
  const locatedVideoIds = new Set(
    locatedStories.map((story) => story.videoId).filter(Boolean),
  )
  const unassignedStories = Object.values(youtubeVideosById)
    .filter((video) => !locatedVideoIds.has(video.videoId))
    .map((video) => ({
      ...video,
      state: '',
      location: 'Location not yet assigned',
    }))

  return sortVideosByPublishedDate(
    [...locatedStories, ...unassignedStories].filter(
      (story) => !youtubeVideosById[story.videoId]?.isShort,
    ),
  )
}
