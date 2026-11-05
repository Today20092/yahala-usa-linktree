import * as React from 'react'
import { createPortal } from 'react-dom'
import type { StoryMapPlace } from '@/lib/story-map'
import './VisitedPlacesLeafletMap.css'

const StoryMap = React.lazy(() => import('./StoryMap'))
type Props = {
  places: StoryMapPlace[]
  selectedCity?: string
  onSelectPlace?: (state: string, city: string) => void
  spacious?: boolean
}

export default function VisitedPlacesLeafletMap(props: Props) {
  const [mounted, setMounted] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const dialog = React.useRef<HTMLDialogElement>(null)
  React.useEffect(() => setMounted(true), [])
  React.useEffect(() => {
    if (!expanded) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.showModal()
    return () => { document.body.style.overflow = previousOverflow }
  }, [expanded])
  const content = <div className={`story-map-shell bg-muted relative aspect-[2/1] min-h-72 overflow-hidden rounded-xl border border-border ${expanded ? 'story-map-expanded' : ''} ${props.spacious ? 'sm:min-h-[28rem]' : ''}`} aria-label="Map">
    <MapErrorBoundary>
    <React.Suspense fallback={<MapLoading />}>
      {mounted ? <StoryMap {...props} expanded={expanded} onToggleExpanded={() => setExpanded(!expanded)} /> : <MapLoading />}
    </React.Suspense>
    </MapErrorBoundary>
  </div>
  return expanded ? createPortal(<dialog ref={dialog} className="story-map-dialog" aria-label="Expanded story map" onCancel={() => setExpanded(false)}>{content}</dialog>, document.body) : content
}

class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <p role="alert" className="bg-muted text-foreground absolute inset-0 grid place-content-center p-6 text-center">The map is unavailable right now. Use the location filters to keep browsing stories.</p> : this.props.children
  }
}

function MapLoading() {
  return <p role="status" className="bg-background text-foreground absolute inset-0 grid place-items-center text-sm">Loading the map…</p>
}
