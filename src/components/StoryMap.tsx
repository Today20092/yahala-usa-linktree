import * as React from 'react'
import { latLngBounds } from 'leaflet'
import { useMap } from 'react-leaflet'
import {
  Map,
  MapTileLayer,
  MapMarker,
  MapPopup,
  MapTooltip,
  MapMarkerClusterGroup,
  MapZoomControl,
  MapFullscreenControl,
} from './ui/map'
import { Button } from './ui/button'
import type { StoryMapPlace } from '@/lib/story-map'
import { storyBrowserHref } from '@/lib/story-browser'

type Props = {
  places: StoryMapPlace[]
  selectedCity?: string
  onSelectPlace?: (state: string, city: string) => void
  expanded: boolean
  onToggleExpanded: () => void
}

function MapViewport({
  places,
  selectedCity,
}: Pick<Props, 'places' | 'selectedCity'>) {
  const map = useMap()
  React.useEffect(() => {
    map.closePopup()
    if (places.length)
      map.fitBounds(
        latLngBounds(places.map((place) => [place.latitude, place.longitude])),
        {
          padding: [40, 40],
          maxZoom: selectedCity ? 10 : places.length === 1 ? 8 : 5,
          animate: false,
        },
      )
    else map.setView([39.8283, -98.5795], 4)
  }, [map, places, selectedCity])
  React.useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function StoryMap({
  places,
  selectedCity,
  onSelectPlace,
  expanded,
  onToggleExpanded,
}: Props) {
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>(
    'loading',
  )
  return (
    <>
      <div
        className="absolute inset-0"
        inert={status === 'error'}
        aria-hidden={status === 'error' ? true : undefined}
      >
        <Map
          center={[39.8283, -98.5795]}
          zoom={4}
          minZoom={2}
          maxZoom={18}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={expanded || !window.matchMedia('(pointer: coarse)').matches}
          touchZoom
          attributionControl={false}
          className="story-map h-full w-full"
        >
          <MapTileLayer onStatus={setStatus} />
          <MapViewport places={places} selectedCity={selectedCity} />
          <MapMarkerClusterGroup>
            {places.map((place) => (
              <MapMarker
                key={`${place.state}:${place.city}`}
                position={[place.latitude, place.longitude]}
                title={`${place.label}: ${place.storyCount} stories`}
                keyboard
              >
                <MapTooltip direction="top" offset={[0, -24]}>
                  {place.label}
                </MapTooltip>
                <MapPopup>
                  <div className="story-map-popup">
                    <p className="text-foreground text-base font-bold">
                      {place.city}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {place.state} · {place.storyCount}{' '}
                      {place.storyCount === 1 ? 'story' : 'stories'}
                    </p>
                    {onSelectPlace ? (
                      <Button
                        type="button"
                        className="mt-3 min-h-11"
                        onClick={() => onSelectPlace(place.state, place.city)}
                      >
                        Browse stories
                      </Button>
                    ) : (
                      <Button
                        className="mt-3 min-h-11"
                        nativeButton={false}
                        role="link"
                        render={
                          <a
                            href={storyBrowserHref(place.state, place.city)}
                            aria-label="Browse stories"
                          />
                        }
                      >
                        Browse stories
                      </Button>
                    )}
                  </div>
                </MapPopup>
              </MapMarker>
            ))}
          </MapMarkerClusterGroup>
          <MapZoomControl />
          <MapFullscreenControl
            expanded={expanded}
            onToggle={onToggleExpanded}
          />
        </Map>
      </div>
      <div className="story-map-attribution">
        ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenStreetMap
        </a>{' '}
        ·{' '}
        <a
          href="https://openfreemap.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenFreeMap
        </a>{' '}
        ·{' '}
        <a
          href="https://www.openmaptiles.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenMapTiles
        </a>
      </div>
      {status === 'loading' && (
        <p
          role="status"
          className="bg-background text-foreground pointer-events-none absolute bottom-8 left-3 z-[800] rounded-lg px-3 py-2 text-sm"
        >
          Loading the map…
        </p>
      )}
      {status === 'error' && (
        <div
          role="alert"
          className="bg-muted text-foreground absolute inset-0 z-[900] grid place-content-center gap-2 p-6 text-center"
        >
          <p className="font-semibold">The map is unavailable right now.</p>
          <p className="text-sm">
            Map tiles couldn't load. Use the location filters to keep browsing
            stories.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload map
          </Button>
        </div>
      )}
      {!places.length && status === 'ready' && (
        <p
          role="status"
          className="bg-background text-foreground absolute right-16 bottom-8 left-3 z-[800] rounded-lg px-3 py-2 text-sm"
        >
          No city coordinates for these stories. You can still browse the list
          below.
        </p>
      )}
    </>
  )
}
