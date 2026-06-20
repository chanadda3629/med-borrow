"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createEquipmentItem } from "@/lib/actions/equipment/create-equipment-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface NewEquipmentFormProps {
  equipmentTypes: string[]
}

export function NewEquipmentForm({ equipmentTypes }: NewEquipmentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [equipmentCode, setEquipmentCode] = useState("")
  const [assetNumber, setAssetNumber] = useState("")
  const [equipmentType, setEquipmentType] = useState("")
  const [receivedDate, setReceivedDate] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!equipmentCode.trim()) { setError("กรุณากรอกรหัสอุปกรณ์"); return }
    if (!assetNumber.trim()) { setError("กรุณากรอกหมายเลขครุภัณฑ์"); return }
    if (!equipmentType) { setError("กรุณาเลือกประเภทอุปกรณ์"); return }
    if (!receivedDate) { setError("กรุณาเลือกวันที่รับ"); return }

    setLoading(true)
    try {
      const result = await createEquipmentItem({
        equipmentCode: equipmentCode.trim(),
        assetNumber: assetNumber.trim(),
        equipmentType,
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
            <Label htmlFor="equipmentCode">รหัสอุปกรณ์</Label>
            <Input
              id="equipmentCode"
              value={equipmentCode}
              onChange={(e) => setEquipmentCode(e.target.value)}
              placeholder="เช่น WC-001"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assetNumber">หมายเลขครุภัณฑ์</Label>
            <Input
              id="assetNumber"
              value={assetNumber}
              onChange={(e) => setAssetNumber(e.target.value)}
              placeholder="เช่น 1234-5678"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="equipmentType">ประเภทอุปกรณ์</Label>
            <Select
              id="equipmentType"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
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
            <Label htmlFor="receivedDate">วันที่รับเข้าคลัง</Label>
            <Input
              id="receivedDate"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกอุปกรณ์"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
