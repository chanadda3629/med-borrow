"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"

// Statuses that can be reverted one step. Limited to the pre-approval stages,
// where no equipment has been assigned yet — so stepping back has no side
// effects to undo. Approval and everything after it are one-way.
const REVERTIBLE_PREVIOUS: Record<string, string> = {
  "ประเมินผู้ป่วย": "รับคำร้อง",
  "AI แนะนำอุปกรณ์": "ประเมินผู้ป่วย",
  "ตรวจสอบคลังอุปกรณ์": "AI แนะนำอุปกรณ์",
}

// Move a request back to the immediately previous workflow status (undo a
// mis-step). Records the reversal in the status-history table.
export async function revertWorkflow(requestId: string) {
  try {
    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    // Normalize legacy English-coded statuses before the reversal lookup.
    const current = toThaiWorkflowStatus(request.workflowStatus)
    const previous = REVERTIBLE_PREVIOUS[current]
    if (!previous) return err("ไม่สามารถย้อนสถานะในขั้นตอนนี้ได้")

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: { workflowStatus: previous },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: current, toStatus: previous },
      }),
    ])

    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
