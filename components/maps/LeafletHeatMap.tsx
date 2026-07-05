"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
import { LocateFixed, Loader2 } from "lucide-react"
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
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle")

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    setStatus("locating")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(coords)
        map.setView(coords, 16)
        setStatus("idle")
      },
      (err) => {
        console.warn("ไม่สามารถเข้าถึงตำแหน่งของคุณได้", err.message)
        setStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(coords)
        map.setView(coords, 16)
      },
      (err) => console.warn("ไม่สามารถเข้าถึงตำแหน่งของคุณได้", err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ marginTop: 58 }}>
        <div className="leaflet-bar leaflet-control">
          <button
            type="button"
            onClick={locate}
            title="ค้นหาตำแหน่งของฉัน"
            className="flex h-[30px] w-[30px] items-center justify-center bg-white text-gray-700 hover:bg-gray-100"
          >
            {status === "locating" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </button>
        </div>
        {status === "error" && (
          <div className="leaflet-control mt-1 rounded bg-white px-2 py-1 text-xs text-red-600 shadow">
            หาตำแหน่งไม่สำเร็จ
          </div>
        )}
      </div>
      {position && (
        <CircleMarker
          center={position}
          radius={8}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
        >
          <Tooltip>ตำแหน่งของคุณ</Tooltip>
        </CircleMarker>
      )}
    </>
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
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
        <HeatLayer points={points} />
        <UserLocation />
      </MapContainer>
    </div>
  )
}
