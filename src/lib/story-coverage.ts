import type { Story } from './story-browser'

export function buildStoryCoverage(stories: Story[]) {
  const states = new Map<string, Set<string>>()
  for (const story of stories) {
    if (!story.state || !story.videoId) continue
    const videos = states.get(story.state) ?? new Set<string>()
    videos.add(story.videoId)
    states.set(story.state, videos)
  }
  return [...states]
    .map(([name, videos]) => ({
      name,
      value: videos.size,
      href: `/stories?${new URLSearchParams({ state: name })}`,
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
}
