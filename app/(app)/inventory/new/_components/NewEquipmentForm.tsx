"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createEquipmentItem } from "@/lib/actions/equipment/create-equipment-item"
import { previewEquipmentCode } from "@/lib/actions/equipment/preview-equipment-code"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent } from "@/components/ui/card"

interface NewEquipmentFormProps {
  equipmentTypes: string[]
}

export function NewEquipmentForm({ equipmentTypes }: NewEquipmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [equipmentType, setEquipmentType] = useState("")
  const [condition, setCondition] = useState("ดี")
  const [donorName, setDonorName] = useState("")
  const [receivedDate, setReceivedDate] = useState("")

  // Preview of the auto-generated code. Recomputed whenever type + date are both
  // set; the value shown here is regenerated authoritatively on save. The ref
  // guards against an earlier request resolving after a later one.
  const [previewCode, setPreviewCode] = useState("")
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const previewSeq = useRef(0)

  async function refreshPreview(type: string, date: string) {
    const seq = ++previewSeq.current

    if (!type || !date) {
      setPreviewCode("")
      setPreviewError(null)
      setPreviewing(false)
      return
    }

    setPreviewing(true)
    setPreviewError(null)
    try {
      const result = await previewEquipmentCode({ equipmentType: type, receivedDate: date })
      if (seq !== previewSeq.current) return // superseded by a newer change
      if (result.success) {
        setPreviewCode(result.data.code)
      } else {
        setPreviewCode("")
        setPreviewError(result.error)
      }
    } finally {
      if (seq === previewSeq.current) setPreviewing(false)
    }
  }

  function handleTypeChange(value: string) {
    setEquipmentType(value)
    void refreshPreview(value, receivedDate)
  }

  function handleDateChange(value: string) {
    setReceivedDate(value)
    void refreshPreview(equipmentType, value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!equipmentType) { setError("กรุณาเลือกประเภทอุปกรณ์"); return }
    if (!receivedDate) { setError("กรุณาเลือกวันที่รับ"); return }

    setLoading(true)
    try {
      const result = await createEquipmentItem({
        equipmentType,
        condition,
        donorName: donorName.trim() || undefined,
        receivedDate,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      router.push(`/inventory/${result.data.itemId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="equipmentType">
              ประเภทอุปกรณ์ <span className="text-danger">*</span>
            </Label>
            <Select
              id="equipmentType"
              value={equipmentType}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={loading}
            >
              <option value="">เลือกประเภทอุปกรณ์</option>
              {equipmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="condition">
              สภาพอุปกรณ์ <span className="text-danger">*</span>
            </Label>
            <Select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              disabled={loading}
            >
              <option value="ดี">ดี</option>
              <option value="ชำรุด">ชำรุด</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="donorName">ชื่อผู้บริจาค (ถ้ามี)</Label>
            <Input
              id="donorName"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="เช่น คุณสมชาย ใจดี"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receivedDate">
              วันที่รับเข้าคลัง <span className="text-danger">*</span>
            </Label>
            <DatePicker
              id="receivedDate"
              value={receivedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().slice(0, 10)}
              placeholder="เลือกวันที่รับเข้าคลัง"
            />
          </div>

          {/* Auto-generated code preview */}
          <div className="space-y-1.5">
            <Label>รหัสอุปกรณ์ / หมายเลขครุภัณฑ์</Label>
            <div className="flex min-h-12 items-center gap-2 rounded-xl border border-dashed border-accent-200 bg-accent-50 px-4 py-3">
              {previewing ? (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังสร้างรหัส...
                </span>
              ) : previewCode ? (
                <span className="font-mono text-base font-semibold tracking-wide text-accent-700">
                  {previewCode}
                </span>
              ) : previewError ? (
                <span className="text-sm text-danger">{previewError}</span>
              ) : (
                <span className="text-sm text-faint">
                  เลือกประเภทอุปกรณ์และวันที่รับเข้าคลังเพื่อสร้างรหัสอัตโนมัติ
                </span>
              )}
            </div>
            <p className="text-xs text-faint">
              ระบบสร้างรหัสให้อัตโนมัติจากประเภทอุปกรณ์และปีที่รับเข้าคลัง
            </p>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger-soft border border-danger rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || previewing || !previewCode}
          >
            {loading ? "กำลังบันทึก..." : "บันทึกอุปกรณ์"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
