"use client"
import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import type { LatLng } from "leaflet"
import "leaflet/dist/leaflet.css"

interface PinData {
  latitude: number
  longitude: number
  googleMapsUrl: string
}

interface LeafletMapPickerProps {
  initialLat?: number
  initialLng?: number
  onPinChange: (data: PinData) => void
}

function ClickHandler({ onPin }: { onPin: (latlng: LatLng) => void }) {
  useMapEvents({ click: (e) => onPin(e.latlng) })
  return null
}

export function LeafletMapPicker({ initialLat = 18.7883, initialLng = 98.9853, onPinChange }: LeafletMapPickerProps) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const L = useRef<typeof import("leaflet") | null>(null)

  useEffect(() => {
    import("leaflet").then((mod) => {
      L.current = mod.default
      // Fix default icon
      delete (mod.default.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
      mod.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
    })
  }, [])

  async function handlePin(latlng: LatLng) {
    const { lat, lng } = latlng
    setPin({ lat, lng })
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
    onPinChange({ latitude: lat, longitude: lng, googleMapsUrl })

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "User-Agent": "med-borrow-app" } }
      )
      if (res.ok) {
        const data = await res.json() as { display_name?: string }
        console.log("Geocoded:", data.display_name)
      }
    } catch { /* silent - geocoding is optional */ }
  }

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={13}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPin={handlePin} />
        {pin && <Marker position={[pin.lat, pin.lng]} />}
      </MapContainer>
      {pin && (
        <p className="text-xs text-gray-500 mt-1">
          {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
