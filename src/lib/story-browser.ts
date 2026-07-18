import type { CityVideo, VisitedPlaces } from './site-config'
import { sortVideosByPublishedDate } from './video-recency.js'

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
  const stories = (visitedPlaces.stateGroups ?? []).flatMap((group) => [
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

  return sortVideosByPublishedDate(stories)
}
