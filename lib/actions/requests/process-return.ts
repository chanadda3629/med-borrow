"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { returnDataSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"

interface ReturnPhotoInput {
  url: string
  publicId?: string
}

interface ReturnInput {
  requestId: string
  returnDate: string
  receivingStaffName: string
  equipmentPhotos: ReturnPhotoInput[]
  condition: "ใช้งานได้" | "ชำรุด"
  damageNote?: string
}

export async function processReturn(input: ReturnInput) {
  try {
    returnDataSchema.parse({
      returnDate: new Date(input.returnDate),
      receivingStaffName: input.receivingStaffName,
      equipmentPhotos: input.equipmentPhotos.map((photo) => ({
        url: photo.url,
        publicId: photo.publicId,
        kind: "return-condition-photo",
      })),
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
    const [primaryPhoto] = input.equipmentPhotos
    const equipmentPhotos = input.equipmentPhotos.map((photo) => ({
      url: photo.url,
      publicId: photo.publicId ?? null,
    }))

    await db.$transaction([
      db.borrowingReturn.create({
        data: {
          requestId: input.requestId,
          equipmentItemId: request.assignedEquipmentItemId,
          returnDate,
          receivingStaffName: input.receivingStaffName,
          condition: input.condition,
          damageNote: input.damageNote,
          equipmentPhotoUrl: primaryPhoto.url,
          equipmentPhotoPublicId: primaryPhoto.publicId,
          equipmentPhotos,
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
        data: { requestId: input.requestId, fromStatus: toThaiWorkflowStatus(request.workflowStatus), toStatus: "คืนอุปกรณ์" },
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
          equipmentPhotoUrl: primaryPhoto.url,
          equipmentPhotoPublicId: primaryPhoto.publicId,
          equipmentPhotos,
        },
      }),
    ])
    revalidatePath(`/requests/${input.requestId}`)
    revalidatePath("/requests")
    revalidatePath(`/inventory/${request.assignedEquipmentItemId}`)
    revalidatePath("/inventory")
    // returned is pull-only now (receipt available on demand via เช็คสถานะ) — no
    // push, to conserve the free-tier quota. See line-messaging-design.
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
