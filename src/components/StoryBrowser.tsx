import { ChevronDown, ExternalLink, List, Map } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ScrollReveal } from '@/components/animate-ui/ScrollReveal'
import type { Story } from '@/lib/story-browser'
import type { VisitedMapPlace } from '@/lib/site-config'
import { buildStoryMapPlaces } from '@/lib/story-map'
import StoryMapShell from './StoryMapShell'
import {
  isRecentVideo,
  sortVideosByPublishedDate,
} from '@/lib/video-recency.js'
import { resolveYoutubeReference } from '@/lib/youtube-video-id.js'

type Props = { stories: Story[]; places: VisitedMapPlace[] }
const PAGE_SIZE = 24
const UNASSIGNED_FILTER = 'unassigned'

const readFilters = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    state: params.get('state') ?? '',
    city: params.get('city') ?? '',
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
    view: params.get('view') === 'map' ? 'map' : 'list',
  }
}

export default function StoryBrowser({ stories, places }: Props) {
  const [filters, setFilters] = React.useState(readFilters)
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
  const [filtersOpen, setFiltersOpen] = React.useState(() =>
    Boolean(filters.state || filters.city),
  )
  // The summary is hidden from sm up, so keep the disclosure open there even in browsers without ::details-content.
  React.useEffect(() => {
    const wide = window.matchMedia('(min-width: 40rem)')
    const sync = () => wide.matches && setFiltersOpen(true)
    sync()
    wide.addEventListener('change', sync)
    return () => wide.removeEventListener('change', sync)
  }, [])
  const firstAddedStory = React.useRef<HTMLAnchorElement | null>(null)
  const focusAddedStory = React.useRef(false)

  React.useEffect(() => {
    if (!focusAddedStory.current) return
    firstAddedStory.current?.focus()
    focusAddedStory.current = false
  }, [visibleCount])

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
    () =>
      [...new Set(stories.map((story) => story.state).filter(Boolean))].sort(),
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
  const validState =
    !filters.state ||
    filters.state === UNASSIGNED_FILTER ||
    states.includes(filters.state)
  const validCity = !filters.city || cities.includes(filters.city)
  const matches =
    validState && validCity
      ? stories.filter(
          (story) =>
            (!filters.state ||
              (filters.state === UNASSIGNED_FILTER
                ? !story.state
                : story.state === filters.state)) &&
            (!filters.city || story.city === filters.city),
        )
      : []
  const sortedMatches = sortVideosByPublishedDate(matches, filters.sort)
  const mapPlaces = React.useMemo(
    () => buildStoryMapPlaces(places, matches),
    [places, stories, filters.state, filters.city],
  )

  const updateFilters = (
    state: string,
    city = '',
    sort = filters.sort,
    view = filters.view,
  ) => {
    const params = new URLSearchParams()
    if (state) params.set('state', state)
    if (state && city) params.set('city', city)
    if (sort === 'oldest') params.set('sort', sort)
    if (view === 'map') params.set('view', view)
    const query = params.toString()
    history.pushState(null, '', `/stories${query ? `?${query}` : ''}`)
    setFilters({ state, city, sort, view })
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <>
      {/* sm+: summary hidden and ::details-content forced visible, so controls are always shown. */}
      <Card className="gap-0 overflow-visible py-0">
        <details
          open={filtersOpen}
          onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
          className="group sm:[&::details-content]:[content-visibility:visible]"
        >
          <summary className="text-foreground focus-visible:ring-ring/30 flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 text-sm font-semibold focus-visible:ring-3 focus-visible:outline-none sm:hidden [&::-webkit-details-marker]:hidden">
            {[
              'Filters',
              filters.state === UNASSIGNED_FILTER
                ? 'Location not yet assigned'
                : filters.state,
              filters.city,
              filters.sort === 'oldest' ? 'Oldest first' : 'Newest first',
            ]
              .filter(Boolean)
              .join(' · ')}
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            <SearchableSelect
              label="State"
              value={filters.state}
              onValueChange={(state) => updateFilters(state)}
              options={[
                { value: '', label: 'All states' },
                {
                  value: UNASSIGNED_FILTER,
                  label: 'Location not yet assigned',
                },
                ...states.map((state) => ({ value: state, label: state })),
              ]}
            />
            <SearchableSelect
              key={filters.state}
              label="City"
              value={filters.city}
              disabled={!filters.state || filters.state === UNASSIGNED_FILTER}
              onValueChange={(city) => updateFilters(filters.state, city)}
              options={[
                { value: '', label: 'All cities' },
                ...cities.map((city) => ({ value: city, label: city })),
              ]}
            />
            <div className="min-w-0">
              <label
                htmlFor="story-sort"
                className="text-foreground text-sm font-semibold"
              >
                Sort by date
              </label>
              <select
                id="story-sort"
                value={filters.sort}
                onChange={(event) =>
                  updateFilters(
                    filters.state,
                    filters.city,
                    event.currentTarget.value,
                  )
                }
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 mt-2 min-h-12 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </details>
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Explore by location or browse every story.
        </p>
        <ToggleGroup
          aria-label="Story view"
          value={[filters.view]}
          onValueChange={(views) => {
            if (views[0])
              updateFilters(filters.state, filters.city, filters.sort, views[0])
          }}
        >
          <ToggleGroupItem value="list">
            <List aria-hidden="true" />
            List view
          </ToggleGroupItem>
          <ToggleGroupItem value="map">
            <Map aria-hidden="true" />
            Map view
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {filters.view === 'map' && (
        <div className="mt-4">
          <StoryMapShell
            places={mapPlaces}
            selectedCity={filters.city}
            spacious
            onSelectPlace={(state, city) => updateFilters(state, city)}
          />
          <p className="text-muted-foreground mt-2 text-sm">
            Business pins show published addresses where available. Other pins
            show approximate city locations. Grouped pins count locations, not
            stories. All stories remain in the list.
          </p>
        </div>
      )}

      <p className="text-muted-foreground mt-5 text-sm" aria-live="polite">
        Showing {Math.min(visibleCount, matches.length)} of {matches.length}{' '}
        {matches.length === 1 ? 'story' : 'stories'},{' '}
        {filters.sort === 'oldest' ? 'oldest first' : 'newest first'}
      </p>

      {matches.length > 0 ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMatches.slice(0, visibleCount).map((story, index) => {
              if (!story.url) return null
              const thumbnail =
                story.thumbnail ?? resolveYoutubeReference(story.url)?.thumbnail
              const fallback = resolveYoutubeReference(
                story.url,
              )?.thumbnailFallback
              const isNew = isRecentVideo(story.published)
              const date = story.published
                ? new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                  }).format(new Date(story.published))
                : null

              return (
                <ScrollReveal key={`${story.videoId}-${story.location}`}>
                  <Card className="gap-0 py-0">
                    <a
                      ref={
                        index === visibleCount - PAGE_SIZE
                          ? firstAddedStory
                          : undefined
                      }
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-visible:ring-ring group block rounded-xl focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="bg-muted block aspect-video overflow-hidden rounded-t-xl">
                        {thumbnail && (
                          <img
                            src={thumbnail}
                            alt=""
                            loading="lazy"
                            onError={(event) => {
                              if (
                                fallback &&
                                event.currentTarget.src !== fallback
                              ) {
                                event.currentTarget.src = fallback
                              }
                            }}
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          />
                        )}
                      </span>
                      <CardContent className="flex flex-col gap-3 py-4 text-left">
                        <div className="flex min-w-0 flex-col gap-2">
                          {isNew && <Badge>New</Badge>}
                          <h2
                            className="ui-card-title min-w-0 text-start [overflow-wrap:anywhere] break-words whitespace-normal"
                            dir="auto"
                          >
                            {story.title ?? 'Open on YouTube'}
                          </h2>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <span>{story.location}</span>
                          {date && (
                            <>
                              <span aria-hidden="true">·</span>
                              <time dateTime={story.published}>{date}</time>
                            </>
                          )}
                        </div>
                        <span className="text-primary inline-flex items-center gap-1 text-sm font-semibold">
                          Open on YouTube{' '}
                          <ExternalLink className="size-4" aria-hidden="true" />
                        </span>
                      </CardContent>
                    </a>
                  </Card>
                </ScrollReveal>
              )
            })}
          </div>
          {visibleCount < matches.length && (
            <div className="mt-8 text-center">
              <Button
                type="button"
                size="lg"
                className="min-h-11 px-5"
                onClick={() => {
                  focusAddedStory.current = true
                  setVisibleCount((count) => count + PAGE_SIZE)
                }}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="border-border bg-muted/40 mt-5 rounded-xl border border-dashed p-8 text-center">
          <h2 className="ui-card-title">No stories match these filters.</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            The shared link may be stale, or this city has no assigned stories.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => updateFilters('')}
          >
            Clear filters
          </Button>
        </div>
      )}
    </>
  )
}
