"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { rejectRequestSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

export async function rejectRequest(
  requestId: string,
  input: { rejectionReason: string },
) {
  try {
    const parsed = rejectRequestSchema.safeParse(input)
    if (!parsed.success) return err("กรุณาเลือกสาเหตุการไม่อนุมัติ")

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")
    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: {
          workflowStatus: "ไม่อนุมัติ",
          approvalDecision: "ไม่อนุมัติ",
          rejectionReason: parsed.data.rejectionReason,
        },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: toThaiWorkflowStatus(request.workflowStatus), toStatus: "ไม่อนุมัติ" },
      }),
    ])
    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    fireAndForgetLineNotification(requestId, "rejected")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
