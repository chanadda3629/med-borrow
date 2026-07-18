"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { MapPin } from "lucide-react"
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
    let cancelled = false

    import("leaflet")
      .then(async (mod) => {
        const lModule = mod.default as LeafletWithHeat
        if (typeof lModule.heatLayer !== "function") {
          // leaflet.heat is a UMD plugin that patches the global `L`. Expose our
          // ESM leaflet instance as `window.L` first so the plugin attaches
          // `heatLayer` to the same object we use here.
          ;(window as unknown as { L: unknown }).L = lModule
          await loadHeatScript()
        }
        if (cancelled || typeof lModule.heatLayer !== "function") return
        layer = lModule.heatLayer(
          points.map((p) => [p.lat, p.lng, 1.0]),
          { radius: 30, blur: 15, maxZoom: 17 }
        ).addTo(map)
      })
      .catch(() => {
        // A heatmap failure must never crash the rest of the app.
      })

    return () => {
      cancelled = true
      layer?.remove()
    }
  }, [map, points])

  return null
}

/**
 * Requests the user's location on mount. On success: recenters on the user and
 * drops a "you are here" dot. On denial/error: falls back to fitting the patient
 * points (or leaves the default center). Geolocation needs a secure context
 * (HTTPS or localhost) — degrades silently otherwise. Exposes a `locate()`
 * trigger via onLocate so a button can re-request the location.
 */
function LocateUser({
  points,
  onLocate,
}: {
  points: HeatPoint[]
  onLocate?: (locate: () => void) => void
}) {
  const map = useMap()

  useEffect(() => {
    let marker: { remove: () => void } | null = null
    let cancelled = false

    const run = import("leaflet").then((mod) => {
      const L = mod.default

      const fallback = () => {
        if (points.length > 0) {
          map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40] })
        }
      }

      const locate = () => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          fallback()
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return
            const { latitude, longitude } = pos.coords
            map.setView([latitude, longitude], 15)
            marker?.remove()
            marker = L.circleMarker([latitude, longitude], {
              radius: 9,
              color: "#ffffff",
              weight: 3,
              fillColor: "#2563eb",
              fillOpacity: 1,
            })
              .addTo(map)
              .bindTooltip("คุณอยู่ที่นี่", { direction: "top" })
          },
          () => { if (!cancelled) fallback() },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
      }

      onLocate?.(locate)
      locate()
    })

    return () => {
      cancelled = true
      run.then(() => marker?.remove())
    }
  }, [map, points, onLocate])

  return null
}

interface LeafletHeatMapProps {
  points: HeatPoint[]
  center?: [number, number]
  zoom?: number
  satellite?: boolean
  locateUser?: boolean
}

export function LeafletHeatMap({
  points,
  center = [13.7563, 100.5018],
  zoom = 7,
  satellite = false,
  locateUser = false,
}: LeafletHeatMapProps) {
  const [locate, setLocate] = useState<(() => void) | null>(null)

  return (
    <div className="relative h-80 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" style={{ zIndex: 0 }}>
        {satellite ? (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
              maxZoom={19}
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </>
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
        )}
        <HeatLayer points={points} />
        {locateUser && <LocateUser points={points} onLocate={(fn) => setLocate(() => fn)} />}
      </MapContainer>

      {locateUser && (
        <button
          type="button"
          onClick={() => locate?.()}
          className="absolute top-2 right-2 z-[400] flex items-center gap-1 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-white"
        >
          <MapPin className="h-3.5 w-3.5" />
          ตำแหน่งฉัน
        </button>
      )}
    </div>
  )
}
