"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canAssignEquipmentItem } from "@/lib/domain/transitions"
import { approveRequestSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus, toThaiEquipmentStatus } from "@/lib/domain/labels"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

export async function approveRequest(
  requestId: string,
  input: { equipmentItemId: string; approverName: string },
) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const parsed = approveRequestSchema.safeParse(input)
    if (!parsed.success) return err("กรุณากรอกข้อมูลให้ครบถ้วน")
    const { equipmentItemId, approverName } = parsed.data

    const [request, item] = await Promise.all([
      db.borrowingRequest.findUnique({ where: { id: requestId } }),
      db.equipmentItem.findUnique({ where: { id: equipmentItemId } }),
    ])
    if (!request) return err("ไม่พบคำร้อง")
    if (!item) return err("ไม่พบอุปกรณ์")
    // Normalize legacy English-coded equipment statuses (e.g. "available") before
    // the allocation check — the guard compares against the Thai label.
    const itemStatus = toThaiEquipmentStatus(item.currentStatus) as import("@/lib/domain/schemas").EquipmentStatus
    if (!canAssignEquipmentItem(itemStatus, item.currentLoanRequestId)) {
      return err("อุปกรณ์นี้ไม่สามารถจัดสรรได้")
    }

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: {
          workflowStatus: "อนุมัติ",
          approvalDecision: "อนุมัติ",
          approverName,
          assignedEquipmentItemId: equipmentItemId,
        },
      }),
      db.equipmentItem.update({
        where: { id: equipmentItemId },
        data: { currentStatus: "ถูกยืม", currentLoanRequestId: requestId },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: toThaiWorkflowStatus(request.workflowStatus), toStatus: "อนุมัติ" },
      }),
      db.equipmentItemStatusHistory.create({
        data: { equipmentItemId, fromStatus: itemStatus, toStatus: "ถูกยืม" },
      }),
    ])
    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    revalidatePath(`/inventory/${equipmentItemId}`)
    revalidatePath("/inventory")
    fireAndForgetLineNotification(requestId, "approved")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
