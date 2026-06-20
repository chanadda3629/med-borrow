"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { approveRequest } from "@/lib/actions/requests/approve-request"
import { rejectRequest } from "@/lib/actions/requests/reject-request"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface AvailableItem {
  id: string
  assetNumber: string
  equipmentCode: string
}

interface ApproveRequestFormProps {
  requestId: string
  availableItems: AvailableItem[]
}

export function ApproveRequestForm({ requestId, availableItems }: ApproveRequestFormProps) {
  const router = useRouter()
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    if (!selectedItemId) {
      setError("กรุณาเลือกอุปกรณ์ที่จะจัดสรร")
      return
    }
    setError(null)
    const result = await approveRequest(requestId, selectedItemId)
    if (!result.success) {
      setError(result.error)
    } else {
      router.push(`/requests/${requestId}`)
    }
  }

  async function handleReject() {
    setError(null)
    const result = await rejectRequest(requestId)
    if (!result.success) {
      setError(result.error)
    } else {
      router.push(`/requests/${requestId}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Item selection */}
      <div className="space-y-2">
        {availableItems.map((item) => (
          <label
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
              selectedItemId === item.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="equipmentItem"
              value={item.id}
              checked={selectedItemId === item.id}
              onChange={(e) => {
                setSelectedItemId(e.target.value)
                setError(null)
              }}
              className="accent-blue-600"
            />
            <div>
              <div className="font-medium text-sm">{item.assetNumber}</div>
              <div className="text-xs text-gray-500">รหัส: {item.equipmentCode}</div>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <ConfirmDialog
          trigger={
            <Button className="w-full" disabled={!selectedItemId}>
              อนุมัติและจัดสรรอุปกรณ์
            </Button>
          }
          title="ยืนยันการอนุมัติ"
          description="ต้องการอนุมัติคำร้องและจัดสรรอุปกรณ์ที่เลือกใช่หรือไม่?"
          onConfirm={handleApprove}
        />

        <ConfirmDialog
          trigger={
            <Button variant="destructive" className="w-full">
              ไม่อนุมัติคำร้อง
            </Button>
          }
          title="ยืนยันการไม่อนุมัติ"
          description="ต้องการไม่อนุมัติคำร้องนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
          confirmLabel="ไม่อนุมัติ"
          variant="destructive"
          onConfirm={handleReject}
        />
      </div>
    </div>
  )
}
