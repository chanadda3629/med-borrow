"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canTransitionBorrowWorkflowStatus } from "@/lib/domain/transitions"
import { prepareDeliverySchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"

interface PrepareDeliveryInput {
  requestDetail?: string
  deliveryDate: string
  dueDate: string
  delivererName: string
  deliveryContactPhone: string
}

// "เตรียมจัดส่ง" stage (transition อนุมัติ → เตรียมจัดส่ง): record the delivery plan
// for the already-approved/assigned item.
export async function prepareDelivery(requestId: string, input: PrepareDeliveryInput) {
  try {
    const parsed = prepareDeliverySchema.safeParse(input)
    if (!parsed.success) return err("กรุณากรอกข้อมูลการจัดส่งให้ครบถ้วน")
    const { requestDetail, deliveryDate, dueDate, delivererName, deliveryContactPhone } = parsed.data

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    // Normalize legacy English-coded statuses before the transition check.
    const from = toThaiWorkflowStatus(request.workflowStatus)
    if (from !== "อนุมัติ" || !canTransitionBorrowWorkflowStatus(from, "เตรียมจัดส่ง")) {
      return err("ไม่สามารถเตรียมจัดส่งในสถานะปัจจุบันได้")
    }

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: {
          workflowStatus: "เตรียมจัดส่ง",
          deliveryStatus: "เตรียมจัดส่ง",
          requestDetail: requestDetail || null,
          deliveryDate,
          dueOrReturnDate: dueDate,
          delivererName,
          deliveryContactPhone,
        },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: from, toStatus: "เตรียมจัดส่ง" },
      }),
    ])

    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    // preparing-delivery is pull-only now (patient taps เช็คสถานะ) to conserve the
    // free-tier push quota. See line-messaging-design.
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
