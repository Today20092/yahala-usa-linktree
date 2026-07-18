import { ExternalLink } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Story } from '@/lib/story-browser'
import { isRecentVideo } from '@/lib/video-recency.js'
import { resolveYoutubeReference } from '@/lib/youtube-video-id.js'

type Props = { stories: Story[] }
const PAGE_SIZE = 24

const readFilters = () => {
  const params = new URLSearchParams(window.location.search)
  return { state: params.get('state') ?? '', city: params.get('city') ?? '' }
}

export default function StoryBrowser({ stories }: Props) {
  const [filters, setFilters] = React.useState(readFilters)
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)

  React.useEffect(() => {
    const sync = () => {
      setFilters(readFilters())
      setVisibleCount(PAGE_SIZE)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const states = React.useMemo(
    () => [...new Set(stories.map((story) => story.state))].sort(),
    [stories],
  )
  const cities = React.useMemo(
    () =>
      filters.state
        ? [
            ...new Set(
              stories
                .filter((story) => story.state === filters.state)
                .map((story) => story.city)
                .filter(Boolean),
            ),
          ].sort()
        : [],
    [filters.state, stories],
  ) as string[]
  const validState = !filters.state || states.includes(filters.state)
  const validCity = !filters.city || cities.includes(filters.city)
  const matches =
    validState && validCity
      ? stories.filter(
          (story) =>
            (!filters.state || story.state === filters.state) &&
            (!filters.city || story.city === filters.city),
        )
      : []

  const updateFilters = (state: string, city = '') => {
    const params = new URLSearchParams()
    if (state) params.set('state', state)
    if (state && city) params.set('city', city)
    const query = params.toString()
    history.pushState(null, '', `/stories${query ? `?${query}` : ''}`)
    setFilters({ state, city })
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      <div className="border-border bg-card grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:p-5">
        <label className="text-foreground text-sm font-semibold">
          State
          <select
            value={filters.state}
            onChange={(event) => updateFilters(event.currentTarget.value)}
            className="border-border bg-background focus-visible:ring-ring mt-2 min-h-11 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
        <label className="text-foreground text-sm font-semibold">
          City
          <select
            value={filters.city}
            disabled={!filters.state}
            onChange={(event) =>
              updateFilters(filters.state, event.currentTarget.value)
            }
            className="border-border bg-background focus-visible:ring-ring mt-2 min-h-11 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-muted-foreground mt-5 text-sm" aria-live="polite">
        {matches.length} {matches.length === 1 ? 'story' : 'stories'}
      </p>

      {matches.length > 0 ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.slice(0, visibleCount).map((story) => {
              if (!story.url) return null
              const thumbnail = story.thumbnail ?? resolveYoutubeReference(story.url)?.thumbnail
              const fallback = resolveYoutubeReference(story.url)?.thumbnailFallback
              const isNew = isRecentVideo(story.published)
              const date = story.published
                ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(story.published))
                : null

              return (
                <Card key={`${story.videoId}-${story.location}`} className="gap-0 py-0">
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${story.title ?? 'story'} from ${story.location} on YouTube${isNew ? ' — New story' : ''}`}
                    className="focus-visible:ring-ring group block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="bg-muted block aspect-video overflow-hidden rounded-t-xl">
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            if (fallback && event.currentTarget.src !== fallback) {
                              event.currentTarget.src = fallback
                            }
                          }}
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      )}
                    </span>
                    <CardContent className="space-y-3 py-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-foreground text-base leading-snug font-semibold break-words" dir="auto">
                          {story.title ?? 'Open on YouTube'}
                        </h2>
                        {isNew && <Badge className="shrink-0">New</Badge>}
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span>{story.location}</span>
                        {date && <><span aria-hidden="true">·</span><time dateTime={story.published}>{date}</time></>}
                      </div>
                      <span className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
                        Open on YouTube <ExternalLink className="size-4" aria-hidden="true" />
                      </span>
                    </CardContent>
                  </a>
                </Card>
              )
            })}
          </div>
          {visibleCount < matches.length && (
            <div className="mt-8 text-center">
              <Button type="button" size="lg" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="border-border bg-muted/40 mt-5 rounded-xl border border-dashed p-8 text-center">
          <h2 className="text-foreground text-lg font-semibold">No stories match these filters.</h2>
          <p className="text-muted-foreground mt-2 text-sm">The shared link may be stale, or this city has no assigned stories.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => updateFilters('')}>Clear filters</Button>
        </div>
      )}
    </>
  )
}
