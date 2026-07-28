import { ChevronDown, MapPin } from 'lucide-react'
import * as React from 'react'

import type { VisitedStateGroup } from '@/lib/site-config'
import { storyBrowserHref } from '@/lib/story-browser'

type Props = { stateGroups: VisitedStateGroup[] }

export default function VisitedPlacesExplorer({ stateGroups }: Props) {
  const availableGroups = stateGroups.filter((group) => group.videoCount > 0)
  const videoCount = availableGroups.reduce(
    (total, group) => total + group.videoCount,
    0,
  )

  return (
    <div className="visited-state-picker mt-5">
      <div className="visited-state-picker__intro">
        <span className="visited-state-picker__icon" aria-hidden="true">
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-foreground text-base font-bold">
            Find stories near you
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {availableGroups.length} states · {videoCount} stories
          </p>
        </div>
      </div>

      <div className="visited-state-picker__control">
        <label
          htmlFor="visited-state-select"
          className="text-foreground block text-sm font-semibold"
        >
          Browse stories by state
        </label>
        <div className="relative mt-2">
          <select
            id="visited-state-select"
            defaultValue=""
            className="border-border bg-background text-foreground hover:border-primary/55 focus-visible:border-primary focus-visible:ring-primary/20 min-h-12 w-full appearance-none rounded-lg border px-4 pr-11 text-base font-semibold transition-[border-color,box-shadow] focus-visible:ring-4 focus-visible:outline-none"
            onChange={(event) => {
              const state = event.currentTarget.value
              if (state) window.location.assign(storyBrowserHref(state))
            }}
          >
            <option value="">Choose a state</option>
            {availableGroups.map((group) => (
              <option key={group.state} value={group.state}>
                {group.state} — {group.videoCount} stories
              </option>
            ))}
          </select>
          <ChevronDown
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </div>
        <a
          href="/stories"
          className="text-primary focus-visible:ring-ring mt-3 inline-flex rounded-sm text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Browse all stories
        </a>
      </div>
    </div>
  )
}
