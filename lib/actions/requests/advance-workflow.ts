"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canTransitionBorrowWorkflowStatus } from "@/lib/domain/transitions"
import { borrowWorkflowStatusSchema } from "@/lib/domain/schemas"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

type LineNotificationTrigger = "preparing-delivery" | "delivery-completed" | "returned"

const TRIGGER_MAP: Record<string, LineNotificationTrigger> = {
  "เตรียมจัดส่ง": "preparing-delivery",
  "จัดส่งสำเร็จ": "delivery-completed",
  "คืนอุปกรณ์": "returned",
}

export async function advanceWorkflow(requestId: string, toStatus: string) {
  try {
    const parsed = borrowWorkflowStatusSchema.safeParse(toStatus)
    if (!parsed.success) return err("สถานะไม่ถูกต้อง")

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    const from = borrowWorkflowStatusSchema.parse(request.workflowStatus)
    if (!canTransitionBorrowWorkflowStatus(from, parsed.data)) return err("ไม่สามารถเปลี่ยนสถานะได้")

    await db.$transaction([
      db.borrowingRequest.update({ where: { id: requestId }, data: { workflowStatus: parsed.data } }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: from, toStatus: parsed.data },
      }),
    ])

    const trigger = TRIGGER_MAP[parsed.data]
    if (trigger) fireAndForgetLineNotification(requestId, trigger)
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
