"use client"
import { useState, useRef } from "react"
import { Camera, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Photo {
  url: string
  publicId: string
}

interface PhotoGalleryUploadFieldProps {
  value: Photo[]
  onChange: (photos: Photo[]) => void
  max?: number
  className?: string
}

export function PhotoGalleryUploadField({
  value,
  onChange,
  max = 5,
  className,
}: PhotoGalleryUploadFieldProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/uploads", { method: "POST", body: form })
      if (!res.ok) throw new Error("Upload failed")
      const data = (await res.json()) as Photo
      onChange([...value, data])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  const canAddMore = value.length < max

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-3">
        {value.map((photo, i) => (
          <div key={photo.publicId || i} className="relative">
            <img
              src={photo.url}
              alt={`รูปที่ ${i + 1}`}
              className="w-24 h-24 object-cover rounded-lg border border-hairline"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center transition-all duration-150 ease-apple active:scale-[0.97]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-faint hover:border-accent-400 hover:text-accent-500 hover:bg-accent-50 transition-all duration-150 ease-apple disabled:opacity-50"
          >
            {loading ? (
              <Camera className="w-6 h-6 animate-pulse" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
            <span className="text-xs">{loading ? "กำลังอัปโหลด..." : "เพิ่มรูป"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e)}
      />
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  )
}
