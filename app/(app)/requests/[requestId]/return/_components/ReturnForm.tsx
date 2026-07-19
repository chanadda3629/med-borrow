"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { processReturn } from "@/lib/actions/requests/process-return"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { PhotoGalleryUploadField } from "@/components/forms/PhotoGalleryUploadField"

interface ReturnFormProps {
  requestId: string
  /** กำหนดคืน (due date) — the latest date allowed for the return, ISO yyyy-mm-dd. */
  maxDate?: string
}

export function ReturnForm({ requestId, maxDate }: ReturnFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [returnDate, setReturnDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    // If today is already past the due date, default to the due date so it stays in range.
    return maxDate && today > maxDate ? maxDate : today
  })
  const [receivingStaffName, setReceivingStaffName] = useState("")
  const [photos, setPhotos] = useState<{ url: string; publicId: string }[]>([])
  const [condition, setCondition] = useState<"ใช้งานได้" | "ชำรุด">("ใช้งานได้")
  const [damageNote, setDamageNote] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!returnDate) { setError("กรุณาเลือกวันที่รับคืน"); return }
    if (!receivingStaffName.trim()) { setError("กรุณากรอกชื่อเจ้าหน้าที่ผู้รับคืน"); return }
    if (photos.length < 1) { setError("กรุณาถ่ายรูปสภาพอุปกรณ์อย่างน้อย 1 รูป"); return }
    if (condition === "ชำรุด" && !damageNote.trim()) {
      setError("กรุณากรอกรายละเอียดความเสียหาย")
      return
    }

    setLoading(true)
    try {
      const result = await processReturn({
        requestId,
        returnDate,
        receivingStaffName: receivingStaffName.trim(),
        equipmentPhotos: photos,
        condition,
        damageNote: condition === "ชำรุด" ? damageNote.trim() : undefined,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      router.push(`/requests/${requestId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="returnDate">วันที่รับคืน</Label>
        <DatePicker
          id="returnDate"
          value={returnDate}
          onChange={setReturnDate}
          max={maxDate}
          placeholder="เลือกวันที่รับคืน"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receivingStaffName">ชื่อเจ้าหน้าที่ผู้รับคืน</Label>
        <Input
          id="receivingStaffName"
          value={receivingStaffName}
          onChange={(e) => setReceivingStaffName(e.target.value)}
          placeholder="กรอกชื่อ-สกุล"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          รูปภาพสภาพอุปกรณ์{" "}
          <span className="text-xs font-normal text-gray-500">(อย่างน้อย 1 รูป สูงสุด 3 รูป)</span>
        </Label>
        <PhotoGalleryUploadField
          value={photos}
          onChange={setPhotos}
          max={3}
        />
      </div>

      <div className="space-y-2">
        <Label>สภาพอุปกรณ์</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="condition"
              value="ใช้งานได้"
              checked={condition === "ใช้งานได้"}
              onChange={() => { setCondition("ใช้งานได้"); setDamageNote("") }}
              className="accent-green-600"
              disabled={loading}
            />
            <span className="text-sm font-medium text-green-700">ใช้งานได้</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="condition"
              value="ชำรุด"
              checked={condition === "ชำรุด"}
              onChange={() => setCondition("ชำรุด")}
              className="accent-red-600"
              disabled={loading}
            />
            <span className="text-sm font-medium text-red-700">ชำรุด</span>
          </label>
        </div>
      </div>

      {condition === "ชำรุด" && (
        <div className="space-y-1.5">
          <Label htmlFor="damageNote">
            รายละเอียดความเสียหาย <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="damageNote"
            value={damageNote}
            onChange={(e) => setDamageNote(e.target.value)}
            placeholder="อธิบายลักษณะความเสียหาย..."
            rows={3}
            disabled={loading}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "ยืนยันการรับคืนอุปกรณ์"}
      </Button>
    </form>
  )
}
