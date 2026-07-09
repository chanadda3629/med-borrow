"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, useMapEvents } from "react-leaflet"
import type { Icon, LatLng } from "leaflet"
import { LocateFixed, Loader2, MapPin, Search, X } from "lucide-react"
import "leaflet/dist/leaflet.css"

const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
  <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 27 17 27s17-14.25 17-27C34 7.6 26.4 0 17 0z" fill="#0d9488"/>
  <circle cx="17" cy="17" r="6.5" fill="#ffffff"/>
</svg>
`.trim()

interface PinData {
  latitude: number
  longitude: number
  googleMapsUrl: string
}

interface SearchResult {
  displayName: string
  primary: string
  secondary: string
  lat: number
  lng: number
}

interface LeafletMapPickerProps {
  initialLat?: number
  initialLng?: number
  onPinChange: (data: PinData) => void
}

function splitDisplayName(displayName: string): { primary: string; secondary: string } {
  const parts = displayName.split(",").map((p) => p.trim())
  return { primary: parts[0] ?? displayName, secondary: parts.slice(1).join(", ") }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { Accept: "application/json" } }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { display_name?: string }
    return data.display_name ?? null
  } catch {
    return null
  }
}

function ClickHandler({ onPin }: { onPin: (latlng: LatLng) => void }) {
  useMapEvents({ click: (e) => onPin(e.latlng) })
  return null
}

function FlyToTarget({ target }: { target: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.75 })
  }, [target, map])
  return null
}

function LocateMeControl({ onLocate }: { onLocate: (lat: number, lng: number, zoom?: number) => void }) {
  const map = useMap()
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle")

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    setStatus("locating")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: 0.75 })
        onLocate(pos.coords.latitude, pos.coords.longitude, 17)
        setStatus("idle")
      },
      (err) => {
        console.warn("ไม่สามารถเข้าถึงตำแหน่งของคุณได้", err.message)
        setStatus("error")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="leaflet-bottom leaflet-right !mb-4 !mr-3">
      <div className="leaflet-control">
        <button
          type="button"
          onClick={locate}
          title="ค้นหาตำแหน่งของฉัน"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal-700 shadow-lg ring-1 ring-black/5 hover:bg-gray-50 active:scale-95 transition"
        >
          {status === "locating" ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <LocateFixed className="h-4.5 w-4.5" />
          )}
        </button>
        {status === "error" && (
          <div className="mt-1.5 rounded-md bg-white px-2 py-1 text-[10px] text-red-600 shadow">
            หาตำแหน่งไม่สำเร็จ
          </div>
        )}
      </div>
    </div>
  )
}

// Bangkok — used only as a neutral fallback if the browser has no initial pin and geolocation fails/is denied.
const FALLBACK_LAT = 13.7563
const FALLBACK_LNG = 100.5018

export function LeafletMapPicker({ initialLat = FALLBACK_LAT, initialLng = FALLBACK_LNG, onPinChange }: LeafletMapPickerProps) {
  const hasInitialPin = Boolean(initialLat && initialLng)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    hasInitialPin ? { lat: initialLat, lng: initialLng } : null
  )
  const [addressLabel, setAddressLabel] = useState<string | null>(null)
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null)
  const [pinIcon, setPinIcon] = useState<Icon | null>(null)

  // No pin picked yet — recenter on the user's actual location instead of the hardcoded fallback.
  useEffect(() => {
    if (hasInitialPin) return
    if (typeof navigator === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyTarget({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 15 }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRequestId = useRef(0)

  useEffect(() => {
    import("leaflet").then((mod) => {
      setPinIcon(
        new mod.default.Icon({
          iconUrl: `data:image/svg+xml,${encodeURIComponent(PIN_SVG)}`,
          iconSize: [34, 44],
          iconAnchor: [17, 44],
          popupAnchor: [0, -38],
        })
      )
    })
  }, [])

  const applyPin = useCallback(
    async (lat: number, lng: number, knownLabel?: string) => {
      setPin({ lat, lng })
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
      onPinChange({ latitude: lat, longitude: lng, googleMapsUrl })

      if (knownLabel) {
        setAddressLabel(knownLabel)
        return
      }
      setIsResolvingAddress(true)
      const label = await reverseGeocode(lat, lng)
      setAddressLabel(label)
      setIsResolvingAddress(false)
    },
    [onPinChange]
  )

  async function handlePin(latlng: LatLng) {
    await applyPin(latlng.lat, latlng.lng)
  }

  function handleLocate(lat: number, lng: number, zoom = 17) {
    setFlyTarget({ lat, lng, zoom })
    void applyPin(lat, lng)
  }

  function handleSelectResult(result: SearchResult) {
    setFlyTarget({ lat: result.lat, lng: result.lng, zoom: 17 })
    void applyPin(result.lat, result.lng, result.displayName)
    setQuery(result.primary)
    setResults([])
    setShowResults(false)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setShowResults(true)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    if (value.trim().length < 3) {
      setResults([])
      setIsSearching(false)
      return
    }

    const requestId = ++searchRequestId.current
    setIsSearching(true)
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=th&accept-language=th&q=${encodeURIComponent(value)}`,
          { headers: { Accept: "application/json" } }
        )
        if (requestId !== searchRequestId.current) return
        if (!res.ok) {
          setResults([])
          return
        }
        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>
        setResults(
          data.map((item) => ({
            displayName: item.display_name,
            ...splitDisplayName(item.display_name),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }))
        )
      } catch {
        if (requestId === searchRequestId.current) setResults([])
      } finally {
        if (requestId === searchRequestId.current) setIsSearching(false)
      }
    }, 400)
  }

  function clearQuery() {
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative">
        {/* Search bar overlay, LINE-style */}
        <div className="absolute inset-x-3 top-3 z-[1000]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setShowResults(true)}
              placeholder="ค้นหาสถานที่หรือที่อยู่ผู้ป่วย"
              className="w-full rounded-full border border-gray-200 bg-white/95 py-2.5 pl-10 pr-9 text-sm text-gray-800 shadow-lg backdrop-blur placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {showResults && query.trim().length >= 3 && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
              {isSearching ? (
                <div className="flex items-center gap-2 px-3.5 py-3 text-xs text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังค้นหาสถานที่...
                </div>
              ) : results.length > 0 ? (
                results.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    type="button"
                    onClick={() => handleSelectResult(r)}
                    className="flex w-full items-start gap-2.5 border-b border-gray-100 px-3.5 py-2.5 text-left last:border-b-0 hover:bg-gray-50"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800">{r.primary}</span>
                      {r.secondary && (
                        <span className="block truncate text-xs text-gray-500">{r.secondary}</span>
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3.5 py-3 text-xs text-gray-400">ไม่พบสถานที่ที่ค้นหา</div>
              )}
            </div>
          )}
        </div>

        <MapContainer
          center={[initialLat, initialLng]}
          zoom={13}
          zoomControl={false}
          className="h-72 w-full sm:h-96"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
            maxNativeZoom={19}
            maxZoom={19}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19}
            maxZoom={19}
            opacity={0.85}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={19}
            maxZoom={19}
          />
          <ZoomControl position="bottomleft" />
          <FlyToTarget target={flyTarget} />
          <LocateMeControl onLocate={handleLocate} />
          <ClickHandler onPin={handlePin} />
          {pin && pinIcon && <Marker position={[pin.lat, pin.lng]} icon={pinIcon} />}
        </MapContainer>
      </div>

      {pin && (
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <div className="min-w-0">
              {isResolvingAddress ? (
                <p className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังค้นหาชื่อสถานที่...
                </p>
              ) : (
                <p className="text-sm font-medium leading-snug text-gray-800">
                  {addressLabel ?? "ตำแหน่งที่ปักหมุด"}
                </p>
              )}
              <p className="mt-0.5 text-xs font-medium text-teal-700">
                พิกัด: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
