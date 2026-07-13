import * as React from 'react'
import 'leaflet/dist/leaflet.css'
import './VisitedPlacesLeafletMap.css'

import type { VisitedMapPlace } from '@/lib/site-config'

type Props = {
  places: VisitedMapPlace[]
}

const mapContainerClass =
  'visited-places-leaflet-map bg-muted dark:bg-background/35 border-border/70 relative isolate aspect-[2/1] overflow-hidden rounded-lg border shadow-inner'

const mapBoundsPadding: [number, number] = [32, 32]

export default function VisitedPlacesLeafletMap({ places }: Props) {
  const mapRef = React.useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = React.useRef<import('leaflet').Map | null>(null)

  React.useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    if (typeof window === 'undefined') return

    let isMounted = true

    const loadMap = async () => {
      const L = await import('leaflet')
      if (!isMounted || !mapRef.current || mapInstanceRef.current) return

      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: !isTouchDevice,
        touchZoom: true,
        tap: true,
        preferCanvas: true,
      })

      mapInstanceRef.current = map

      L.control.zoom({ position: 'topright' }).addTo(map)

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(map)

      const markerIcon = L.divIcon({
        className: '',
        html: `
          <span aria-hidden="true" class="group relative grid size-5 -translate-x-1/2 -translate-y-full place-items-center border-0 bg-transparent p-0">
            <span class="bg-foreground/20 absolute top-full left-1/2 h-1 w-3 -translate-x-1/2 -translate-y-1 rounded-full blur-[1px] dark:bg-black/45"></span>
            <span class="bg-primary ring-primary/35 dark:ring-background/80 relative grid size-4 -rotate-45 place-items-center rounded-[50%_50%_50%_0] shadow-sm ring-1 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md dark:shadow-sm dark:group-hover:shadow-md">
              <span class="bg-primary-foreground dark:bg-background size-1.5 rounded-full ring-1 ring-[color-mix(in_oklch,var(--primary)_18%,transparent)]"></span>
            </span>
          </span>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 20],
      })

      const markerGroup = L.featureGroup()

      places.forEach((place) => {
        const label = place.label
        const marker = L.marker([place.latitude, place.longitude], {
          icon: markerIcon,
          keyboard: true,
          title: label,
        })

        marker.on('click', () => {
          window.dispatchEvent(
            new CustomEvent('visited-state-select', {
              detail: { state: place.state, city: place.city },
            }),
          )
        })

        marker.bindTooltip(label, {
          direction: 'top',
          offset: [0, -18],
          opacity: 1,
          className:
            'visited-places-tooltip rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground shadow-lg',
        })

        marker.addTo(markerGroup)
      })

      markerGroup.addTo(map)

      const bounds = markerGroup.getBounds()

      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.18), {
          padding: mapBoundsPadding,
          maxZoom: 5,
        })
      } else {
        map.setView([39.8283, -98.5795], 4)
      }

      const handleResize = () => {
        map.invalidateSize()
      }

      const handleWheel = (event: WheelEvent) => {
        if (!event.ctrlKey) return

        event.preventDefault()
        const point = map.mouseEventToContainerPoint(event)
        map.setZoomAround(point, map.getZoom() + (event.deltaY < 0 ? 1 : -1))
      }

      window.addEventListener('resize', handleResize)
      mapRef.current.addEventListener('wheel', handleWheel, { passive: false })

      const cleanup = () => {
        window.removeEventListener('resize', handleResize)
        mapRef.current?.removeEventListener('wheel', handleWheel)
        map.remove()
        mapInstanceRef.current = null
      }

      return cleanup
    }

    let cleanup: undefined | (() => void)
    loadMap().then((result) => {
      cleanup = result
    })

    return () => {
      isMounted = false
      cleanup?.()
    }
  }, [places])

  return <div ref={mapRef} className={mapContainerClass} aria-label="Map" />
}
