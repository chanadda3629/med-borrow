"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canAssignEquipmentItem } from "@/lib/domain/transitions"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

export async function approveRequest(requestId: string, equipmentItemId: string) {
  try {
    const [request, item] = await Promise.all([
      db.borrowingRequest.findUnique({ where: { id: requestId } }),
      db.equipmentItem.findUnique({ where: { id: equipmentItemId } }),
    ])
    if (!request) return err("ไม่พบคำร้อง")
    if (!item) return err("ไม่พบอุปกรณ์")
    if (!canAssignEquipmentItem(item.currentStatus as import("@/lib/domain/schemas").EquipmentStatus, item.currentLoanRequestId)) {
      return err("อุปกรณ์นี้ไม่สามารถจัดสรรได้")
    }

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: { workflowStatus: "อนุมัติ", approvalDecision: "อนุมัติ", assignedEquipmentItemId: equipmentItemId },
      }),
      db.equipmentItem.update({
        where: { id: equipmentItemId },
        data: { currentStatus: "ถูกยืม", currentLoanRequestId: requestId },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: request.workflowStatus, toStatus: "อนุมัติ" },
      }),
      db.equipmentItemStatusHistory.create({
        data: { equipmentItemId, fromStatus: item.currentStatus, toStatus: "ถูกยืม" },
      }),
    ])
    fireAndForgetLineNotification(requestId, "approved")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
