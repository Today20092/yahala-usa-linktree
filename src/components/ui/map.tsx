// Adapted from shadcn-map (MIT), Copyright (c) 2025 Hin.
// https://github.com/tonghohin/shadcn-map
import * as React from 'react'
import { divIcon } from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, Marker, Popup, Tooltip, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import { MapPin, Maximize, Minimize, Minus, Plus } from 'lucide-react'
import { Button } from './button'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import type {} from 'leaflet.markercluster'
import 'maplibre-gl/dist/maplibre-gl.css'

export { MapContainer as Map, Popup as MapPopup, Tooltip as MapTooltip }

export function MapMarker({ children, ...props }: Omit<React.ComponentProps<typeof Marker>, 'icon'>) {
  const icon = React.useMemo(() => divIcon({
    className: 'story-map-marker',
    html: renderToStaticMarkup(<MapPin aria-hidden="true" size={28} fill="var(--primary)" stroke="var(--primary-foreground)" />),
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    popupAnchor: [0, -24],
  }), [])
  return <Marker {...props} icon={icon}>{children}</Marker>
}

export function MapMarkerClusterGroup({ children }: { children: React.ReactNode }) {
  return <MarkerClusterGroup chunkedLoading maxClusterRadius={40} showCoverageOnHover={false} iconCreateFunction={(cluster: import('leaflet').MarkerCluster) => divIcon({
    className: 'story-map-cluster',
    html: `<span aria-label="${cluster.getChildCount()} cities">${cluster.getChildCount()}</span>`,
    iconSize: [40, 40],
  })}>{children}</MarkerClusterGroup>
}

export function MapTileLayer({ onStatus }: { onStatus: (status: 'loading' | 'ready' | 'error') => void }) {
  const map = useMap()
  const [raster, setRaster] = React.useState(false)
  const rasterTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const rasterFailed = React.useRef(false)
  React.useEffect(() => {
    if (raster) return
    let cancelled = false
    let layer: import('leaflet').Layer | undefined
    let glMap: import('maplibre-gl').Map | undefined
    let timer: ReturnType<typeof setTimeout>
    const fallback = () => { if (!cancelled) { clearTimeout(timer); setRaster(true) } }
    onStatus('loading')
    timer = setTimeout(fallback, 15000)
    import('@maplibre/maplibre-gl-leaflet').then(({ maplibreGL }) => {
      if (cancelled) return
      try {
        layer = maplibreGL({ style: 'https://tiles.openfreemap.org/styles/positron', attributionControl: false })
        layer.addTo(map)
        glMap = (layer as import('leaflet').MaplibreGL).getMaplibreMap()
        glMap.once('load', () => { if (!cancelled) { clearTimeout(timer); onStatus('ready') } })
        glMap.on('error', fallback)
        glMap.on('webglcontextlost', fallback)
      } catch { fallback() }
    }).catch(fallback)
    return () => {
      cancelled = true
      clearTimeout(timer)
      glMap?.off('error', fallback)
      glMap?.off('webglcontextlost', fallback)
      if (layer && map.hasLayer(layer)) map.removeLayer(layer)
    }
  }, [map, onStatus, raster])
  React.useEffect(() => {
    if (!raster) return
    rasterTimer.current = setTimeout(() => onStatus('error'), 15000)
    return () => clearTimeout(rasterTimer.current)
  }, [raster, onStatus])
  return raster ? <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ load: () => { clearTimeout(rasterTimer.current); if (!rasterFailed.current) onStatus('ready') }, tileerror: () => { rasterFailed.current = true; clearTimeout(rasterTimer.current); onStatus('error') } }} /> : null
}

export function MapZoomControl() {
  const map = useMap()
  return <div className="story-map-zoom" aria-label="Map zoom">
    <Button type="button" variant="outline" className="size-11 rounded-lg" aria-label="Zoom in" onClick={() => map.zoomIn()}><Plus /></Button>
    <Button type="button" variant="outline" className="size-11 rounded-lg" aria-label="Zoom out" onClick={() => map.zoomOut()}><Minus /></Button>
  </div>
}

export function MapFullscreenControl({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return <Button type="button" variant="outline" className="story-map-fullscreen size-11 rounded-lg" aria-label={expanded ? 'Exit expanded map' : 'Expand map'} aria-pressed={expanded} onClick={onToggle}>{expanded ? <Minimize /> : <Maximize />}</Button>
}
