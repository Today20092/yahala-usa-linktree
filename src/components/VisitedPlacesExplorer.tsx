import { ExternalLink, MapPin, Play } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import type { VisitedPlace } from "@/lib/site-config"
import { cn } from "@/lib/utils"

type Props = {
  places: VisitedPlace[]
}

const stateAbbreviations = new Map([
  ["Alabama", "AL"],
  ["Alaska", "AK"],
  ["Arizona", "AZ"],
  ["Arkansas", "AR"],
  ["California", "CA"],
  ["Colorado", "CO"],
  ["Connecticut", "CT"],
  ["Delaware", "DE"],
  ["Florida", "FL"],
  ["Georgia", "GA"],
  ["Hawaii", "HI"],
  ["Idaho", "ID"],
  ["Illinois", "IL"],
  ["Indiana", "IN"],
  ["Iowa", "IA"],
  ["Kansas", "KS"],
  ["Kentucky", "KY"],
  ["Louisiana", "LA"],
  ["Maine", "ME"],
  ["Maryland", "MD"],
  ["Massachusetts", "MA"],
  ["Michigan", "MI"],
  ["Minnesota", "MN"],
  ["Mississippi", "MS"],
  ["Missouri", "MO"],
  ["Montana", "MT"],
  ["Nebraska", "NE"],
  ["Nevada", "NV"],
  ["New Hampshire", "NH"],
  ["New Jersey", "NJ"],
  ["New Mexico", "NM"],
  ["New York", "NY"],
  ["North Carolina", "NC"],
  ["North Dakota", "ND"],
  ["Ohio", "OH"],
  ["Oklahoma", "OK"],
  ["Oregon", "OR"],
  ["Pennsylvania", "PA"],
  ["Rhode Island", "RI"],
  ["South Carolina", "SC"],
  ["South Dakota", "SD"],
  ["Tennessee", "TN"],
  ["Texas", "TX"],
  ["Utah", "UT"],
  ["Vermont", "VT"],
  ["Virginia", "VA"],
  ["Washington", "WA"],
  ["West Virginia", "WV"],
  ["Wisconsin", "WI"],
  ["Wyoming", "WY"],
])

function getYoutubeVideoId(url: string) {
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[0]
    }

    if (parsedUrl.searchParams.has("v")) {
      return parsedUrl.searchParams.get("v")
    }

    const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/)
    return embedMatch?.[1] ?? null
  } catch {
    return null
  }
}

function getThumbnail(url: string, thumbnail?: string) {
  if (thumbnail) return thumbnail

  const videoId = getYoutubeVideoId(url)
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
}

function formatPlace(city: string, state: string) {
  return `${city}, ${stateAbbreviations.get(state) ?? state}`
}

export default function VisitedPlacesExplorer({ places }: Props) {
  const [selectedPlace, setSelectedPlace] = React.useState<VisitedPlace | null>(
    null
  )
  const selectedVideos = selectedPlace?.videos ?? []
  const sortedPlaces = React.useMemo(
    () =>
      places
        .map((place, index) => ({ place, index }))
        .sort((a, b) => {
          const videoCountDifference =
            (b.place.videos?.length ?? 0) - (a.place.videos?.length ?? 0)

          return videoCountDifference || a.index - b.index
        })
        .map(({ place }) => place),
    [places]
  )

  return (
    <>
      <ul
        className="mt-3 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1"
        aria-label="Visited cities"
      >
        {sortedPlaces.map((place) => {
          const label = formatPlace(place.city, place.state)
          const hasVideos = Boolean(place.videos?.length)

          return (
            <li key={`${place.city}-${place.state}`}>
              <button
                type="button"
                className={cn(
                  "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  hasVideos
                    ? "border-border bg-card text-foreground hover:bg-accent"
                    : "border-border/70 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:bg-background/55"
                )}
                aria-label={`Show videos from ${label}`}
                onClick={() => setSelectedPlace(place)}
              >
                {hasVideos && <Play className="size-3" aria-hidden="true" />}
                {label}
              </button>
            </li>
          )
        })}
      </ul>

      <Drawer
        open={Boolean(selectedPlace)}
        onOpenChange={(open) => {
          if (!open) setSelectedPlace(null)
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
                <MapPin className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DrawerTitle>
                  {selectedPlace
                    ? `Videos from ${formatPlace(
                        selectedPlace.city,
                        selectedPlace.state
                      )}`
                    : "City videos"}
                </DrawerTitle>
                <DrawerDescription>
                  Watch Ya Hala stories and visits from this city.
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto px-5 pb-2">
            {selectedVideos.length > 0 ? (
              <div className="grid gap-3">
                {selectedVideos.map((video) => {
                  const thumbnail = getThumbnail(video.url, video.thumbnail)

                  return (
                    <a
                      key={`${video.url}-${video.title ?? "video"}`}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-[104px_1fr] gap-3 rounded-lg border border-border bg-card p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="relative aspect-video overflow-hidden rounded-md bg-muted">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt=""
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-muted-foreground">
                            <Play className="size-5" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col justify-between gap-2 py-0.5">
                        <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
                          {video.title ?? "Watch on YouTube"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                          Watch on YouTube
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </span>
                      </span>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/45 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">
                  Videos from this city are coming soon.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add curated YouTube links for this city in site.yaml.
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
