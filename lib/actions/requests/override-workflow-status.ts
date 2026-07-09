"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { requireAdmin } from "@/lib/auth/require-admin"
import { borrowWorkflowStatusSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"

// Admin status correction: sets workflowStatus to ANY valid status, bypassing
// the ordered-transition rules (per product decision). Every change is recorded
// in borrowingRequestStatusHistory.
//
// Caveat: this mutates ONLY the workflowStatus field. It does NOT assign
// equipment / set approvalDecision (the approve page does) nor create return
// records (the return page does). Use the dedicated approve/return flows for
// those side-effects — this is a manual field correction, not a replacement.
export async function overrideWorkflowStatus(requestId: string, toStatus: string) {
  try {
    const session = await requireAdmin()

    const parsed = borrowWorkflowStatusSchema.safeParse(toStatus)
    if (!parsed.success) return err("สถานะไม่ถูกต้อง")

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    const from = request.workflowStatus
    if (from === parsed.data) return err("เป็นสถานะเดิมอยู่แล้ว")

    // Normalize any legacy English code stored in the row before recording it.
    const fromStatus = toThaiWorkflowStatus(from)

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: { workflowStatus: parsed.data },
      }),
      db.borrowingRequestStatusHistory.create({
        data: {
          requestId,
          fromStatus,
          toStatus: parsed.data,
          changedByUserId: session.user.id ?? null,
          note: "ปรับโดยแอดมิน",
        },
      }),
    ])

    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
