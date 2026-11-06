import type { VisitedMapPlace } from './site-config'
import type { Story } from './story-browser'

export type StoryMapPlace = VisitedMapPlace & {
  id: string
  kind: 'business' | 'city'
  address?: string
  storyCount: number
  stories: Story[]
}

const validCoordinates = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Math.abs(latitude) <= 90 &&
  Number.isFinite(longitude) &&
  Math.abs(longitude) <= 180

export function buildStoryMapPlaces(
  places: VisitedMapPlace[],
  stories: Story[],
): StoryMapPlace[] {
  const grouped = new Map<string, StoryMapPlace>()
  for (const story of stories) {
    const business = story.businessLocation
    const precise =
      business && validCoordinates(business.latitude, business.longitude)
    const city = places.find(
      (place) => place.state === story.state && place.city === story.city,
    )
    const location = precise ? business : city
    if (!location || !validCoordinates(location.latitude, location.longitude))
      continue
    const id = precise
      ? `business:${business.address.toLowerCase()}`
      : `city:${story.state}:${story.city}`
    let pin = grouped.get(id)
    if (!pin) {
      pin = {
        id,
        kind: precise ? 'business' : 'city',
        city: story.city ?? '',
        state: story.state,
        label: precise ? business.name : city!.label,
        address: precise ? business.address : undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        storyCount: 0,
        stories: [],
      }
      grouped.set(id, pin)
    }
    if (!pin.stories.some((item) => item.videoId === story.videoId)) {
      pin.stories.push(story)
      pin.storyCount++
    }
  }
  return [...grouped.values()]
}
