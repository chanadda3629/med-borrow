"use client"
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

interface HeatPoint { lat: number; lng: number }

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap()

  useEffect(() => {
    let layer: { remove: () => void } | null = null
    import("leaflet").then(async (L) => {
      // leaflet.heat extends L globally
      const lModule = L.default as typeof import("leaflet") & {
        heatLayer: (points: [number, number, number][], options: object) => { addTo: (map: unknown) => { remove: () => void } }
      }
      if (typeof lModule.heatLayer !== "function") {
        await import("leaflet.heat" as string)
      }
      layer = lModule.heatLayer(
        points.map((p) => [p.lat, p.lng, 1.0]),
        { radius: 30, blur: 15, maxZoom: 17 }
      ).addTo(map)
    })
    return () => { layer?.remove() }
  }, [map, points])

  return null
}

interface LeafletHeatMapProps {
  points: HeatPoint[]
  center?: [number, number]
  zoom?: number
}

export function LeafletHeatMap({ points, center = [13.7563, 100.5018], zoom = 7 }: LeafletHeatMapProps) {
  return (
    <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" style={{ zIndex: 0 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <HeatLayer points={points} />
      </MapContainer>
    </div>
  )
}
