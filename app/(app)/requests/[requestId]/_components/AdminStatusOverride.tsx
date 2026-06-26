"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { overrideWorkflowStatus } from "@/lib/actions/requests/override-workflow-status"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface AdminStatusOverrideProps {
  requestId: string
  currentStatus: string
  allStatuses: readonly string[]
}

export function AdminStatusOverride({
  requestId,
  currentStatus,
  allStatuses,
}: AdminStatusOverrideProps) {
  const router = useRouter()
  const [target, setTarget] = useState(currentStatus)
  const [error, setError] = useState<string | null>(null)

  async function handleOverride() {
    setError(null)
    const result = await overrideWorkflowStatus(requestId, target)
    if (!result.success) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-3 border border-amber-200 bg-amber-50 rounded-lg p-3">
      <p className="text-xs text-amber-700">
        สิทธิ์แอดมิน: เลือกสถานะใดก็ได้โดยไม่ต้องเรียงลำดับ ใช้สำหรับการแก้ไขเชิงปกครองเท่านั้น
      </p>
      <Select value={target} onChange={(e) => setTarget(e.target.value)}>
        {allStatuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <ConfirmDialog
        trigger={
          <Button variant="default" className="w-full" disabled={target === currentStatus}>
            ปรับสถานะเป็น → {target}
          </Button>
        }
        title="ยืนยันการปรับสถานะ (แอดมิน)"
        description={`ต้องการปรับสถานะคำร้องเป็น "${target}" ใช่หรือไม่? การกระทำนี้จะข้ามลำดับขั้นตอนปกติ`}
        onConfirm={handleOverride}
      />
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
