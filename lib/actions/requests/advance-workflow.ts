"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canTransitionBorrowWorkflowStatus } from "@/lib/domain/transitions"
import { borrowWorkflowStatusSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

type LineNotificationTrigger = "delivery-completed"

// Only delivery-completed pushes on a workflow advance — it's actionable (device
// arriving today). preparing-delivery and returned are pull-only (patient taps
// เช็คสถานะ) to conserve the free-tier push quota. See line-messaging-design.
const TRIGGER_MAP: Record<string, LineNotificationTrigger> = {
  "จัดส่งสำเร็จ": "delivery-completed",
}

export async function advanceWorkflow(requestId: string, toStatus: string) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const parsed = borrowWorkflowStatusSchema.safeParse(toStatus)
    if (!parsed.success) return err("สถานะไม่ถูกต้อง")

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    // Normalize legacy English-coded statuses before parsing so seeded/legacy rows
    // don't throw a raw ZodError (which would leak as the user-facing message).
    const from = borrowWorkflowStatusSchema.safeParse(toThaiWorkflowStatus(request.workflowStatus))
    if (!from.success) return err("สถานะปัจจุบันไม่ถูกต้อง")
    if (!canTransitionBorrowWorkflowStatus(from.data, parsed.data)) return err("ไม่สามารถเปลี่ยนสถานะได้")

    await db.$transaction([
      db.borrowingRequest.update({ where: { id: requestId }, data: { workflowStatus: parsed.data } }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: from.data, toStatus: parsed.data },
      }),
    ])

    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    const trigger = TRIGGER_MAP[parsed.data]
    if (trigger) fireAndForgetLineNotification(requestId, trigger)
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
