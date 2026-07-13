import { ExternalLink, MapPin } from 'lucide-react'
import * as React from 'react'

import { IconBadge } from '@/components/ui/icon-badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type {
  CityVideo,
  VisitedPlace,
  VisitedStateGroup,
} from '@/lib/site-config'
import { cn } from '@/lib/utils'
import { resolveYoutubeReference } from '@/lib/youtube-video-id.js'

type Props = {
  stateGroups: VisitedStateGroup[]
}

type VisitedStateSelectEvent = CustomEvent<{ state?: string; city?: string }>

function getThumbnail(url: string, thumbnail?: string) {
  if (thumbnail) return thumbnail
  return resolveYoutubeReference(url)?.thumbnail ?? null
}

function getThumbnailFallback(url: string) {
  return resolveYoutubeReference(url)?.thumbnailFallback ?? null
}

function formatVideoCount(count: number) {
  return `${count} ${count === 1 ? 'video' : 'videos'}`
}

function areStringArraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

function VideoLink({
  video,
  videoKeyPrefix,
}: {
  video: CityVideo
  videoKeyPrefix: string
}) {
  if (!video.url) return null

  const thumbnail = getThumbnail(video.url, video.thumbnail)

  return (
    <a
      key={`${videoKeyPrefix}-${video.url}-${video.title ?? 'video'}`}
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-visible:ring-ring group hover:bg-muted/60 grid grid-cols-[96px_1fr] gap-3 rounded-md p-2 text-left transition focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="bg-muted relative aspect-video overflow-hidden rounded-md">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
            loading="lazy"
            data-fallback-src={getThumbnailFallback(video.url)}
          />
        ) : (
          <span className="text-muted-foreground grid h-full w-full place-items-center">
            <IconBadge tone="solid" size="sm" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="block size-3"
              >
                <path d="M8 5.14v13.72L19.2 12z" />
              </svg>
            </IconBadge>
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-col justify-between gap-2 py-0.5">
        <span className="text-foreground line-clamp-2 text-sm leading-snug font-semibold">
          {video.title ?? 'Open on YouTube'}
        </span>
        <span className="text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 text-xs font-semibold">
          Open on YouTube
          <ExternalLink className="size-3" aria-hidden="true" />
        </span>
      </span>
    </a>
  )
}

export default function VisitedPlacesExplorer({ stateGroups }: Props) {
  const [selectedState, setSelectedState] = React.useState<string | null>(null)
  const [selectedCity, setSelectedCity] = React.useState<string | null>(null)
  const [accordionValue, setAccordionValue] = React.useState<string[]>([])
  const selectedStateGroup =
    stateGroups.find((group) => group.state === selectedState) ?? null
  const selectedPlace =
    selectedStateGroup?.places.find((place) => place.city === selectedCity) ??
    null
  const selectedStateVideos = selectedStateGroup?.stateVideos ?? []
  const selectedPlacesWithVideos = React.useMemo(
    () =>
      selectedStateGroup?.places.filter((place) => place.videos?.length) ?? [],
    [selectedStateGroup],
  )
  const hasSelectedVideos =
    selectedStateVideos.length > 0 || selectedPlacesWithVideos.length > 0
  const selectedPlaceWithVideos = selectedPlace?.videos?.length
    ? selectedPlace
    : null
  const drawerOpen = Boolean(selectedStateGroup)
  const desiredAccordionValue = React.useMemo(() => {
    if (!selectedStateGroup) return []

    if (selectedPlaceWithVideos) {
      return [
        `${selectedPlaceWithVideos.state}-${selectedPlaceWithVideos.city}`,
      ]
    }

    if (selectedStateVideos.length > 0) {
      return ['statewide-videos']
    }

    if (selectedPlacesWithVideos[0]) {
      return [
        `${selectedPlacesWithVideos[0].state}-${selectedPlacesWithVideos[0].city}`,
      ]
    }

    return []
  }, [
    selectedPlaceWithVideos,
    selectedPlacesWithVideos,
    selectedStateGroup,
    selectedStateVideos.length,
  ])

  React.useEffect(() => {
    const stateNames = new Set(stateGroups.map((group) => group.state))
    const handleVisitedStateSelect = (event: Event) => {
      const { state, city } = (event as VisitedStateSelectEvent).detail ?? {}
      if (state && stateNames.has(state)) {
        setSelectedState(state)
        setSelectedCity(city ?? null)
      }
    }

    window.addEventListener('visited-state-select', handleVisitedStateSelect)

    return () => {
      window.removeEventListener(
        'visited-state-select',
        handleVisitedStateSelect,
      )
    }
  }, [stateGroups])

  React.useEffect(() => {
    setAccordionValue((current) =>
      areStringArraysEqual(current, desiredAccordionValue)
        ? current
        : desiredAccordionValue,
    )
  }, [desiredAccordionValue])

  return (
    <>
      <div className="mt-4 flex flex-col gap-2">
        <p
          id="visited-states-control-label"
          className="text-foreground text-xs font-semibold"
        >
          Choose a state to watch stories
        </p>
        <ul
          className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1"
          aria-labelledby="visited-states-control-label"
        >
          {stateGroups.map((group) => {
            const label = group.state
            const hasVideos = group.videoCount > 0
            const isSelected = selectedState === group.state

            return (
              <li key={group.state}>
                <Button
                  type="button"
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'rounded-full shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-px',
                    isSelected && 'shadow-md',
                    !hasVideos && !isSelected && 'text-muted-foreground',
                  )}
                  aria-label={`Show videos from ${label}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedState(group.state)
                    setSelectedCity(null)
                  }}
                >
                  {hasVideos && (
                    <IconBadge
                      tone="solid"
                      size="xs"
                      style={
                        isSelected
                          ? {
                              '--ui-icon-badge-accent':
                                'var(--primary-foreground)',
                              '--ui-icon-badge-foreground': 'var(--primary)',
                            }
                          : {
                              '--ui-icon-badge-accent': 'var(--primary)',
                              '--ui-icon-badge-foreground':
                                'var(--primary-foreground)',
                            }
                      }
                      className="mr-0.5"
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="block size-3"
                      >
                        <path d="M8 5.14v13.72L19.2 12z" />
                      </svg>
                    </IconBadge>
                  )}
                  {label}
                </Button>
              </li>
            )
          })}
        </ul>
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedState(null)
            setSelectedCity(null)
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-start gap-3">
              <span className="bg-muted text-muted-foreground ring-border mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ring-1">
                <MapPin className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DrawerTitle>
                  {selectedStateGroup
                    ? `Videos from ${selectedStateGroup.state}`
                    : 'State videos'}
                </DrawerTitle>
                <DrawerDescription>
                  View Ya Hala stories and visits grouped by state and city.
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-5 pb-2">
            {hasSelectedVideos ? (
              <Accordion
                key={selectedStateGroup?.state ?? 'state-videos'}
                type="multiple"
                value={accordionValue}
                onValueChange={setAccordionValue}
                className="border-border bg-card rounded-lg border"
              >
                {selectedStateVideos.length > 0 && (
                  <AccordionItem
                    value="statewide-videos"
                    className="border-border data-open:bg-card"
                  >
                    <AccordionTrigger className="items-center px-3 py-3 hover:no-underline">
                      <span className="text-foreground min-w-0 truncate text-sm font-semibold">
                        Statewide videos
                      </span>
                      <span className="text-muted-foreground text-xs font-medium">
                        {formatVideoCount(selectedStateVideos.length)}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-1 px-0 pb-2 [&_a]:no-underline">
                      {selectedStateVideos.map((video) => (
                        <VideoLink
                          key={`state-${video.url}-${video.title ?? 'video'}`}
                          video={video}
                          videoKeyPrefix="state"
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}

                {selectedPlacesWithVideos.map((place) => (
                  <AccordionItem
                    key={`${place.city}-${place.state}`}
                    value={`${place.state}-${place.city}`}
                    className="border-border data-open:bg-card"
                  >
                    <AccordionTrigger className="items-center px-3 py-3 hover:no-underline">
                      <span className="text-foreground min-w-0 truncate text-sm font-semibold">
                        {place.label ?? `${place.city}, ${place.state}`}
                      </span>
                      <span className="text-muted-foreground text-xs font-medium">
                        {formatVideoCount(place.videos?.length ?? 0)}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-1 px-0 pb-2 [&_a]:no-underline">
                      {place.videos?.map((video) => (
                        <VideoLink
                          key={`${place.city}-${video.url}-${
                            video.title ?? 'video'
                          }`}
                          video={video}
                          videoKeyPrefix={place.city}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="border-border bg-muted/45 rounded-lg border border-dashed px-4 py-8 text-center">
                <p className="text-foreground text-sm font-semibold">
                  Videos from this state are coming soon.
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Add curated YouTube links or detected locations for this
                  state.
                </p>
              </div>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
