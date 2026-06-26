"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

interface HeatPoint { lat: number; lng: number }

type LeafletWithHeat = typeof import("leaflet") & {
  heatLayer: (
    points: [number, number, number][],
    options: object
  ) => { addTo: (map: unknown) => { remove: () => void } }
}

function loadHeatScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="/leaflet-heat.js"]')) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "/leaflet-heat.js"
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap()

  useEffect(() => {
    let layer: { remove: () => void } | null = null

    import("leaflet").then(async (L) => {
      const lModule = L.default as LeafletWithHeat
      if (typeof lModule.heatLayer !== "function") {
        await loadHeatScript()
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

function UserLocation() {
  const map = useMap()
  const [position, setPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(coords)
        map.setView(coords, 16)
      },
      (err) => {
        console.warn("ไม่สามารถเข้าถึงตำแหน่งของคุณได้", err.message)
      }
    )
  }, [map])

  if (!position) return null
  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
    >
      <Tooltip>ตำแหน่งของคุณ</Tooltip>
    </CircleMarker>
  )
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
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
        />
        <HeatLayer points={points} />
        <UserLocation />
      </MapContainer>
    </div>
  )
}
