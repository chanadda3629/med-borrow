"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { prepareDelivery } from "@/lib/actions/requests/prepare-delivery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"

interface PrepareDeliveryFormProps {
  requestId: string
}

export function PrepareDeliveryForm({ requestId }: PrepareDeliveryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [requestDetail, setRequestDetail] = useState("")
  const [deliveryDate, setDeliveryDate] = useState(today)
  const [dueDate, setDueDate] = useState("")
  const [delivererName, setDelivererName] = useState("")
  const [deliveryContactPhone, setDeliveryContactPhone] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!deliveryDate) { setError("กรุณาเลือกวันที่จัดส่ง"); return }
    if (!dueDate) { setError("กรุณาเลือกกำหนดคืนอุปกรณ์"); return }
    if (!delivererName.trim()) { setError("กรุณากรอกชื่อผู้จัดส่ง"); return }
    if (!/^0(?:6|8|9)\d{8}$/.test(deliveryContactPhone.trim())) {
      setError("กรุณากรอกเบอร์โทรติดต่อวันจัดส่งให้ถูกต้อง (10 หลัก)")
      return
    }

    setLoading(true)
    try {
      const result = await prepareDelivery(requestId, {
        requestDetail: requestDetail.trim() || undefined,
        deliveryDate,
        dueDate,
        delivererName: delivererName.trim(),
        deliveryContactPhone: deliveryContactPhone.trim(),
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
        <Label htmlFor="requestDetail">รายละเอียดคำร้อง</Label>
        <Textarea
          id="requestDetail"
          value={requestDetail}
          onChange={(e) => setRequestDetail(e.target.value)}
          placeholder="รายละเอียดเพิ่มเติมของคำร้อง (ถ้ามี)"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deliveryDate">วันที่จัดส่ง</Label>
        <DatePicker
          id="deliveryDate"
          value={deliveryDate}
          onChange={setDeliveryDate}
          placeholder="เลือกวันที่จัดส่ง"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dueDate">
          กำหนดคืนอุปกรณ์ <span className="text-danger">*</span>
        </Label>
        <DatePicker
          id="dueDate"
          value={dueDate}
          onChange={setDueDate}
          min={deliveryDate || undefined}
          placeholder="เลือกกำหนดคืนอุปกรณ์"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="delivererName">
          ชื่อผู้จัดส่ง <span className="text-danger">*</span>
        </Label>
        <Input
          id="delivererName"
          value={delivererName}
          onChange={(e) => setDelivererName(e.target.value)}
          placeholder="กรอกชื่อ-สกุลผู้จัดส่ง"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deliveryContactPhone">
          เบอร์โทรติดต่อวันจัดส่ง <span className="text-danger">*</span>
        </Label>
        <Input
          id="deliveryContactPhone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={deliveryContactPhone}
          onChange={(e) => setDeliveryContactPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="เบอร์ที่ผู้ป่วย/ญาติโทรติดต่อได้ในวันจัดส่ง"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-sm text-danger-text bg-danger-soft border border-danger rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "ยืนยันเตรียมจัดส่ง"}
      </Button>
    </form>
  )
}
