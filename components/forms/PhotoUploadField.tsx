"use client"
import { useState, useRef } from "react"
import { Camera, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhotoUploadFieldProps {
  value?: { url: string; publicId: string }
  onChange: (data: { url: string; publicId: string } | undefined) => void
  label?: string
  accept?: string
  className?: string
}

export function PhotoUploadField({ value, onChange, label = "อัปโหลดรูปภาพ", accept = "image/*", className }: PhotoUploadFieldProps) {
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
      const data = await res.json() as { url: string; publicId: string }
      onChange(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative inline-block">
          <img src={value.url} alt="uploaded" className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={() => { onChange(undefined); if (inputRef.current) inputRef.current.value = "" }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50">
          <Camera className="w-8 h-8" />
          <span className="text-xs text-center">{loading ? "กำลังอัปโหลด..." : label}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} capture="environment"
        className="hidden" onChange={handleFile} />
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
