import * as React from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import { MapPin, Maximize, Minimize } from 'lucide-react'
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapControls,
  useMap,
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

type Pin = {
  id: string
  longitude: number
  latitude: number
  clusterId?: number
  count?: number
  place?: StoryMapPlace
}

function MapLocations({
  places,
  selectedCity,
  onSelectPlace,
  onStatus,
}: Props & {
  onStatus: (status: 'loading' | 'ready' | 'error') => void
}) {
  const { map, isLoaded } = useMap()
  const [pins, setPins] = React.useState<Pin[]>([])
  const [selected, setSelected] = React.useState<StoryMapPlace | null>(null)
  const [activePin, setActivePin] = React.useState<string | null>(null)
  const trigger = React.useRef<HTMLButtonElement | null>(null)
  const focusNextPin = React.useRef(false)
  const sourceId = React.useId()

  React.useEffect(() => {
    if (!focusNextPin.current || !pins.length || !map) return
    focusNextPin.current = false
    queueMicrotask(() =>
      map
        .getContainer()
        .querySelector<HTMLButtonElement>('[data-map-pin]')
        ?.focus(),
    )
  }, [pins, map])

  React.useEffect(() => {
    if (!selected) return
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setSelected(null)
      trigger.current?.focus()
    }
    document.addEventListener('keydown', dismiss, true)
    return () => document.removeEventListener('keydown', dismiss, true)
  }, [selected])

  React.useEffect(() => {
    if (!map) return
    const timer = setTimeout(() => onStatus('error'), 20000)
    const ready = () => {
      clearTimeout(timer)
      onStatus('ready')
    }
    const failed = () => {
      clearTimeout(timer)
      onStatus('error')
    }
    map.on('load', ready)
    map.on('error', failed)
    if (map.loaded()) ready()
    return () => {
      clearTimeout(timer)
      map.off('load', ready)
      map.off('error', failed)
    }
  }, [map, onStatus])

  React.useEffect(() => {
    if (!map) return
    map.touchZoomRotate.disableRotation()
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])

  React.useEffect(() => {
    if (!map || !isLoaded) return
    setSelected(null)
    setPins([])
    setActivePin(null)
    if (places.length) {
      const longitudes = places.map((place) => place.longitude)
      const latitudes = places.map((place) => place.latitude)
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ]
      map.fitBounds(bounds, {
        padding: 48,
        maxZoom:
          places.length === 1
            ? places[0].kind === 'business'
              ? 15
              : 9
            : selectedCity
              ? 13
              : 5,
        duration: 0,
      })
    } else map.jumpTo({ center: [-98.5795, 39.8283], zoom: 3 })

    map.addSource(sourceId, {
      type: 'geojson',
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 16,
      data: {
        type: 'FeatureCollection',
        features: places.map((place, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [place.longitude, place.latitude],
          },
          properties: { index },
        })),
      },
    })
    // Keep the source active while mapcn DOM markers provide real keyboard targets.
    map.addLayer({
      id: sourceId,
      type: 'circle',
      source: sourceId,
      paint: { 'circle-opacity': 0, 'circle-radius': 0 },
    })
    const sync = () => {
      if (!map.isSourceLoaded(sourceId)) return
      const unique = new globalThis.Map<string, Pin>()
      for (const feature of map.querySourceFeatures(sourceId)) {
        if (feature.geometry.type !== 'Point') continue
        const [longitude, latitude] = feature.geometry.coordinates
        if (!map.getBounds().contains([longitude, latitude])) continue
        const properties = feature.properties!
        const place = places[properties.index]
        const id = properties.cluster
          ? `cluster:${properties.cluster_id}`
          : place?.id
        if (!id) continue
        unique.set(id, {
          id,
          longitude,
          latitude,
          place,
          clusterId: properties.cluster ? properties.cluster_id : undefined,
          count: properties.point_count,
        })
      }
      setPins([...unique.values()])
    }
    map.on('idle', sync)
    sync()
    return () => {
      map.off('idle', sync)
      if (map.getLayer(sourceId)) map.removeLayer(sourceId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  }, [map, isLoaded, places, selectedCity, sourceId])

  const closePopup = () => {
    setSelected(null)
    trigger.current?.focus()
  }
  return (
    <>
      {pins.map((pin) => (
        <MapMarker
          key={pin.id}
          longitude={pin.longitude}
          latitude={pin.latitude}
        >
          <MarkerContent>
            <button
              type="button"
              data-map-pin={pin.id}
              className={
                pin.clusterId !== undefined
                  ? 'story-map-cluster'
                  : 'story-map-marker'
              }
              aria-label={
                pin.clusterId !== undefined
                  ? `${pin.count} locations. Zoom in`
                  : `${pin.place!.label}${pin.place!.kind === 'city' ? ', approximate city location' : ''}: ${pin.place!.storyCount} stories`
              }
              onClick={async (event) => {
                event.stopPropagation()
                if (pin.clusterId !== undefined && map) {
                  const source = map.getSource(sourceId) as GeoJSONSource
                  const zoom = await source.getClusterExpansionZoom(
                    pin.clusterId,
                  )
                  focusNextPin.current = true
                  map.easeTo({
                    center: [pin.longitude, pin.latitude],
                    zoom,
                    duration: 0,
                  })
                } else {
                  trigger.current = event.currentTarget
                  setActivePin(pin.id)
                  map?.panTo([pin.longitude, pin.latitude], { duration: 0 })
                  setSelected(pin.place!)
                }
              }}
            >
              {pin.clusterId !== undefined ? (
                pin.count
              ) : (
                <MapPin aria-hidden="true" size={28} />
              )}
            </button>
            {activePin === pin.id && !selected && (
              <MarkerLabel
                position="top"
                className="pointer-events-none w-max max-w-48 whitespace-normal"
              >
                <span
                  data-selected-map-label
                  dir="auto"
                  className="bg-background text-foreground block rounded-md border px-2 py-1 text-xs"
                >
                  {pin.place!.label}
                </span>
              </MarkerLabel>
            )}
          </MarkerContent>
          {pin.place && !selected && activePin !== pin.id && (
            <MarkerTooltip anchor="bottom" offset={20} maxWidth="224px">
              <span dir="auto">
                {pin.place.label}
                {pin.place.kind === 'city'
                  ? ' (approximate city location)'
                  : ''}
              </span>
            </MarkerTooltip>
          )}
        </MapMarker>
      ))}
      {selected && (
        <MapPopup
          key={selected.id}
          longitude={selected.longitude}
          latitude={selected.latitude}
          onClose={closePopup}
          closeOnClick={false}
          anchor="center"
          offset={0}
          className="max-h-64 w-48 overflow-y-auto sm:w-62"
          closeButton
        >
          <div className="story-map-popup">
            <p className="text-foreground pr-5 text-base font-bold" dir="auto">
              {selected.label}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {selected.address ??
                `${selected.state} · Approximate city location`}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {selected.storyCount}{' '}
              {selected.storyCount === 1 ? 'story' : 'stories'}
            </p>
            {selected.kind === 'business' ? (
              <>
                <ul className="mt-3 grid max-h-48 gap-3 overflow-y-auto">
                  {selected.stories.map((story) => (
                    <li key={story.videoId}>
                      <a
                        className="text-primary block min-h-8 text-sm underline underline-offset-4"
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="auto"
                      >
                        {story.title ?? 'Open on YouTube'}
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  className="text-primary mt-3 inline-block min-h-8 text-sm underline underline-offset-4"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address!)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open address in maps
                </a>
              </>
            ) : onSelectPlace ? (
              <Button
                type="button"
                className="mt-3 min-h-11"
                onClick={() => onSelectPlace(selected.state, selected.city)}
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
                    href={storyBrowserHref(selected.state, selected.city)}
                    aria-label="Browse stories"
                  />
                }
              >
                Browse stories
              </Button>
            )}
          </div>
        </MapPopup>
      )}
    </>
  )
}

export default function StoryMap(props: Props) {
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
          center={[-98.5795, 39.8283]}
          zoom={3}
          minZoom={2}
          maxZoom={18}
          scrollZoom={false}
          cooperativeGestures={!props.expanded}
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
          attributionControl={false}
          className="story-map h-full w-full"
        >
          <MapLocations {...props} onStatus={setStatus} />
          <MapControls position="top-right" showZoom />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="story-map-fullscreen"
            aria-label={props.expanded ? 'Collapse map' : 'Expand map'}
            onClick={props.onToggleExpanded}
          >
            {props.expanded ? <Minimize /> : <Maximize />}
          </Button>
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
        · ©{' '}
        <a
          href="https://carto.com/attributions"
          target="_blank"
          rel="noopener noreferrer"
        >
          CARTO
        </a>
      </div>
      {status === 'loading' && (
        <p
          role="status"
          className="bg-background text-foreground pointer-events-none absolute bottom-8 left-3 rounded-lg px-3 py-2 text-sm"
        >
          Loading the map…
        </p>
      )}
      {status === 'error' && (
        <div
          role="alert"
          className="bg-muted text-foreground absolute inset-0 grid place-content-center gap-2 p-6 text-center"
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
      {!props.places.length && status === 'ready' && (
        <p
          role="status"
          className="bg-background text-foreground absolute right-16 bottom-8 left-3 rounded-lg px-3 py-2 text-sm"
        >
          No mapped locations for these stories. You can still browse the list
          below.
        </p>
      )}
    </>
  )
}
