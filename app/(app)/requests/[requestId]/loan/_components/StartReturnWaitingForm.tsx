"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { startReturnWaiting } from "@/lib/actions/requests/start-return-waiting"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"

interface StartReturnWaitingFormProps {
  requestId: string
  defaultDelivererName?: string
}

export function StartReturnWaitingForm({ requestId, defaultDelivererName }: StartReturnWaitingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [receivedDate, setReceivedDate] = useState(today)
  const [receiverName, setReceiverName] = useState("")
  const [delivererName, setDelivererName] = useState(defaultDelivererName ?? "")
  const [loanDetail, setLoanDetail] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!receivedDate) { setError("กรุณาเลือกวันที่รับอุปกรณ์"); return }
    if (!receiverName.trim()) { setError("กรุณากรอกชื่อผู้รับอุปกรณ์"); return }
    if (!delivererName.trim()) { setError("กรุณากรอกชื่อผู้จัดส่งอุปกรณ์"); return }

    setLoading(true)
    try {
      const result = await startReturnWaiting(requestId, {
        receivedDate,
        receiverName: receiverName.trim(),
        delivererName: delivererName.trim(),
        loanDetail: loanDetail.trim() || undefined,
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
        <Label htmlFor="receivedDate">
          วันที่รับอุปกรณ์ <span className="text-danger">*</span>
        </Label>
        <DatePicker
          id="receivedDate"
          value={receivedDate}
          onChange={setReceivedDate}
          max={today}
          placeholder="เลือกวันที่รับอุปกรณ์"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="receiverName">
          ชื่อผู้รับอุปกรณ์ <span className="text-danger">*</span>
        </Label>
        <Input
          id="receiverName"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          placeholder="กรอกชื่อ-สกุลผู้รับอุปกรณ์"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="delivererName">
          ผู้จัดส่งอุปกรณ์ <span className="text-danger">*</span>
        </Label>
        <Input
          id="delivererName"
          value={delivererName}
          onChange={(e) => setDelivererName(e.target.value)}
          placeholder="กรอกชื่อ-สกุลผู้จัดส่งอุปกรณ์"
          disabled={loading}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="loanDetail">รายละเอียดการยืม</Label>
        <Textarea
          id="loanDetail"
          value={loanDetail}
          onChange={(e) => setLoanDetail(e.target.value)}
          placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการยืม (ถ้ามี)"
          rows={3}
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-sm text-danger-text bg-danger-soft border border-danger rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "กำลังบันทึก..." : "ยืนยันเริ่มการยืม (รอคืน)"}
      </Button>
    </form>
  )
}
