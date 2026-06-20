"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

export async function rejectRequest(requestId: string) {
  try {
    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")
    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: { workflowStatus: "ไม่อนุมัติ", approvalDecision: "ไม่อนุมัติ" },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: request.workflowStatus, toStatus: "ไม่อนุมัติ" },
      }),
    ])
    fireAndForgetLineNotification(requestId, "rejected")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
