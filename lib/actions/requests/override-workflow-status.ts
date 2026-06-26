"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { requireAdmin } from "@/lib/auth/require-admin"
import { borrowWorkflowStatusSchema } from "@/lib/domain/schemas"

export async function overrideWorkflowStatus(requestId: string, toStatus: string) {
  try {
    const session = await requireAdmin()

    const parsed = borrowWorkflowStatusSchema.safeParse(toStatus)
    if (!parsed.success) return err("สถานะไม่ถูกต้อง")

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    const from = request.workflowStatus
    if (from === parsed.data) return err("เป็นสถานะเดิมอยู่แล้ว")

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: { workflowStatus: parsed.data },
      }),
      db.borrowingRequestStatusHistory.create({
        data: {
          requestId,
          fromStatus: from,
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
