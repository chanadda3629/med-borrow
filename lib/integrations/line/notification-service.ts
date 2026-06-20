import { db } from "@/lib/db"
import { sendLinePushMessage } from "./line-client"

type Trigger =
  | "request-submitted" | "approved" | "rejected"
  | "preparing-delivery" | "delivery-completed"
  | "return-due-soon" | "returned"

const TEMPLATES: Record<Trigger, (name: string) => string> = {
  "request-submitted": (n) => `ระบบได้รับคำร้องขอยืมอุปกรณ์ของ ${n} เรียบร้อยแล้ว`,
  "approved": (n) => `คำร้องขอยืมอุปกรณ์ของ ${n} ได้รับการอนุมัติแล้ว`,
  "rejected": (n) => `คำร้องขอยืมอุปกรณ์ของ ${n} ไม่ได้รับการอนุมัติ`,
  "preparing-delivery": (n) => `กำลังเตรียมจัดส่งอุปกรณ์ให้ ${n}`,
  "delivery-completed": (n) => `จัดส่งอุปกรณ์ให้ ${n} สำเร็จแล้ว`,
  "return-due-soon": (n) => `อุปกรณ์ของ ${n} ใกล้ถึงกำหนดคืน`,
  "returned": (n) => `รับคืนอุปกรณ์ของ ${n} เรียบร้อยแล้ว`,
}

export async function sendLineNotification(requestId: string, trigger: Trigger): Promise<void> {
  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: { patient: { select: { id: true, fullName: true, phoneNumber: true } } },
  })
  if (!request) throw new Error(`Request ${requestId} not found`)

  const message = TEMPLATES[trigger](request.patient.fullName)
  const channelValue = request.patient.phoneNumber
  const triggeredAt = new Date()

  try {
    await sendLinePushMessage(channelValue, message)
    await db.notificationHistory.create({
      data: { patientId: request.patientId, requestId, channelType: "phone",
        channelValue, trigger, deliveryStatus: "sent", message, triggeredAt, deliveredAt: new Date() },
    })
  } catch (error) {
    await db.notificationHistory.create({
      data: { patientId: request.patientId, requestId, channelType: "phone",
        channelValue, trigger, deliveryStatus: "failed", message, triggeredAt,
        errorMessage: error instanceof Error ? error.message : "Unknown error" },
    })
    throw error
  }
}
