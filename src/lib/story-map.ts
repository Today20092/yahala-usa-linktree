import type { VisitedMapPlace } from './site-config'
import type { Story } from './story-browser'

export type StoryMapPlace = VisitedMapPlace & { storyCount: number }

export function buildStoryMapPlaces(
  places: VisitedMapPlace[],
  stories: Story[],
): StoryMapPlace[] {
  return places.flatMap((place) => {
    const storyCount = new Set(
      stories
        .filter(
          (story) => story.state === place.state && story.city === place.city,
        )
        .map((story) => story.videoId),
    ).size
    return storyCount > 0 &&
      Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude)
      ? [{ ...place, storyCount }]
      : []
  })
}
