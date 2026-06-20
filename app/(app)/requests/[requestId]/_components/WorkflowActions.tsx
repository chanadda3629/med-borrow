"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { advanceWorkflow } from "@/lib/actions/requests/advance-workflow"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface WorkflowActionsProps {
  requestId: string
  nextStatuses: readonly string[]
}

export function WorkflowActions({ requestId, nextStatuses }: WorkflowActionsProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleAdvance(toStatus: string) {
    setError(null)
    const result = await advanceWorkflow(requestId, toStatus)
    if (!result.success) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  if (nextStatuses.length === 0) return null

  return (
    <div className="space-y-2">
      {nextStatuses.map((status) => (
        <ConfirmDialog
          key={status}
          trigger={
            <Button variant="default" className="w-full">
              เปลี่ยนสถานะ → {status}
            </Button>
          }
          title="ยืนยันการเปลี่ยนสถานะ"
          description={`ต้องการเปลี่ยนสถานะเป็น "${status}" ใช่หรือไม่?`}
          onConfirm={() => handleAdvance(status)}
        />
      ))}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
