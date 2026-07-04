"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { overrideWorkflowStatus } from "@/lib/actions/requests/override-workflow-status"
import { BORROW_WORKFLOW_STATUSES } from "@/lib/domain/constants"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface StatusOverrideProps {
  requestId: string
  currentStatus: string
}

export function StatusOverride({ requestId, currentStatus }: StatusOverrideProps) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentStatus)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    const result = await overrideWorkflowStatus(requestId, selected)
    if (!result.success) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  const unchanged = selected === currentStatus

  return (
    <div className="space-y-2">
      <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
        {BORROW_WORKFLOW_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      {unchanged ? (
        <Button className="w-full" disabled>
          บันทึกสถานะ
        </Button>
      ) : (
        <ConfirmDialog
          trigger={
            <Button className="w-full">บันทึกสถานะ</Button>
          }
          title="ยืนยันการเปลี่ยนสถานะ"
          description={`ต้องการตั้งสถานะคำร้องเป็น "${selected}" ใช่หรือไม่?`}
          onConfirm={handleSave}
        />
      )}

      <p className="text-xs text-amber-600">
        * เปลี่ยนสถานะโดยตรง (ข้ามลำดับขั้นได้) สำหรับการแก้ไขของแอดมิน — บันทึกลงประวัติเสมอ
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
