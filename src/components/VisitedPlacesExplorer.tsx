import { MapPin } from 'lucide-react'
import * as React from 'react'

import type { VisitedStateGroup } from '@/lib/site-config'
import { storyBrowserHref } from '@/lib/story-browser'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Button } from '@/components/ui/button'

type Props = {
  stateGroups: Pick<VisitedStateGroup, 'state' | 'videoCount'>[]
}

export default function VisitedPlacesExplorer({ stateGroups }: Props) {
  const [selectedState, setSelectedState] = React.useState('')
  const [hydrated, setHydrated] = React.useState(false)
  const fallbackForm = React.useRef<HTMLFormElement>(null)
  React.useEffect(() => {
    const form = fallbackForm.current
    // Keep the native form if a visitor has already started using it.
    if (
      form &&
      (form.contains(document.activeElement) || new FormData(form).get('state'))
    )
      return
    setHydrated(true)
  }, [])
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
        {hydrated ? (
          <SearchableSelect
            label="Browse stories by state"
            value={selectedState}
            onValueChange={setSelectedState}
            options={[
              { value: '', label: 'Choose a state' },
              ...availableGroups.map((group) => ({
                value: group.state,
                label: `${group.state} — ${group.videoCount} stories`,
              })),
            ]}
          />
        ) : (
          <form ref={fallbackForm} action="/stories" method="get">
            <label
              htmlFor="visited-state-select"
              className="text-foreground text-sm font-semibold"
            >
              Browse stories by state
            </label>
            <select
              id="visited-state-select"
              name="state"
              defaultValue=""
              required
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-12 w-full rounded-lg border px-3 text-base focus-visible:ring-2"
            >
              <option value="" disabled>
                Choose a state
              </option>
              {availableGroups.map((group) => (
                <option key={group.state} value={group.state}>
                  {group.state} — {group.videoCount} stories
                </option>
              ))}
            </select>
            <Button type="submit" className="mt-3 min-h-11">
              View stories
            </Button>
          </form>
        )}
        <div className="mt-3 flex flex-col items-start gap-x-6 gap-y-2 sm:flex-row sm:flex-wrap sm:items-center">
          {selectedState && (
            <a
              href={storyBrowserHref(selectedState)}
              className="text-primary focus-visible:ring-ring inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
            >
              Browse stories in {selectedState}
            </a>
          )}
          <a
            href="/stories"
            className="text-primary focus-visible:ring-ring inline-flex min-h-11 items-center rounded-sm text-sm font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            Browse all stories
          </a>
        </div>
      </div>
    </div>
  )
}
