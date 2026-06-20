"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { returnDataSchema } from "@/lib/domain/schemas"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

interface ReturnInput {
  requestId: string
  returnDate: string
  receivingStaffName: string
  equipmentPhotoUrl: string
  equipmentPhotoPublicId?: string
  condition: "ใช้งานได้" | "ชำรุด"
  damageNote?: string
}

export async function processReturn(input: ReturnInput) {
  try {
    returnDataSchema.parse({
      returnDate: new Date(input.returnDate),
      receivingStaffName: input.receivingStaffName,
      equipmentPhoto: { url: input.equipmentPhotoUrl, kind: "return-condition-photo" },
      condition: input.condition,
      damageNote: input.damageNote,
    })

    const request = await db.borrowingRequest.findUnique({
      where: { id: input.requestId },
      include: { assignedEquipmentItem: true },
    })
    if (!request || !request.assignedEquipmentItemId) return err("ไม่พบข้อมูลคำร้อง")

    const newItemStatus = input.condition === "ใช้งานได้" ? "พร้อมใช้งาน" : "ชำรุด"
    const returnDate = new Date(input.returnDate)

    await db.$transaction([
      db.borrowingReturn.create({
        data: {
          requestId: input.requestId,
          equipmentItemId: request.assignedEquipmentItemId,
          returnDate,
          receivingStaffName: input.receivingStaffName,
          condition: input.condition,
          damageNote: input.damageNote,
          equipmentPhotoUrl: input.equipmentPhotoUrl,
          equipmentPhotoPublicId: input.equipmentPhotoPublicId,
        },
      }),
      db.equipmentItem.update({
        where: { id: request.assignedEquipmentItemId },
        data: { currentStatus: newItemStatus, currentLoanRequestId: null },
      }),
      db.borrowingRequest.update({
        where: { id: input.requestId },
        data: { workflowStatus: "คืนอุปกรณ์" },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId: input.requestId, fromStatus: request.workflowStatus, toStatus: "คืนอุปกรณ์" },
      }),
      db.equipmentItemStatusHistory.create({
        data: {
          equipmentItemId: request.assignedEquipmentItemId,
          fromStatus: request.assignedEquipmentItem!.currentStatus,
          toStatus: newItemStatus,
        },
      }),
      db.equipmentItemReturnHistory.create({
        data: {
          equipmentItemId: request.assignedEquipmentItemId,
          requestId: input.requestId,
          condition: input.condition,
          returnDate,
          receivingStaffName: input.receivingStaffName,
          damageNote: input.damageNote,
          equipmentPhotoUrl: input.equipmentPhotoUrl,
          equipmentPhotoPublicId: input.equipmentPhotoPublicId,
        },
      }),
    ])
    fireAndForgetLineNotification(input.requestId, "returned")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
