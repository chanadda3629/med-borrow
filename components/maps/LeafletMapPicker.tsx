"use client"
import { useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L, { type LatLng } from "leaflet"
import "leaflet/dist/leaflet.css"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// Self-hosted default marker icon. Built once, synchronously, so the marker is
// never created with the broken bundler URL (the classic invisible-marker bug).
const pinIcon = L.icon({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Chiang Mai — default map center when no pin has been chosen yet.
const DEFAULT_CENTER: [number, number] = [18.7883, 98.9853]

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

export function LeafletMapPicker({ initialLat, initialLng, onPinChange }: LeafletMapPickerProps) {
  // Only seed a pin when a real (non-zero) coordinate is supplied (e.g. restored draft).
  const hasInitial =
    typeof initialLat === "number" &&
    typeof initialLng === "number" &&
    (initialLat !== 0 || initialLng !== 0)

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    hasInitial ? { lat: initialLat as number, lng: initialLng as number } : null
  )

  const center: [number, number] = hasInitial
    ? [initialLat as number, initialLng as number]
    : DEFAULT_CENTER

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
        center={center}
        zoom={hasInitial ? 16 : 13}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPin={handlePin} />
        {pin && <Marker icon={pinIcon} position={[pin.lat, pin.lng]} />}
      </MapContainer>
      {pin && (
        <p className="text-xs text-gray-500 mt-1">
          {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
