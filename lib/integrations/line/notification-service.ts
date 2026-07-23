import { db } from "@/lib/db"
import { sendLinePushMessage } from "./line-client"

export type Trigger =
  | "request-submitted" | "approved" | "rejected"
  | "preparing-delivery" | "delivery-completed"
  | "return-due-soon" | "returned"

type TemplateContext = {
  name: string
  equipmentType: string
  dueOrReturnDate: Date | null
  deliveryContactPhone: string | null
}

function daysRemaining(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function formatThaiDate(date: Date): string {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
}

const TEMPLATES: Record<Trigger, (ctx: TemplateContext) => string> = {
  "request-submitted": ({ name }) => `ระบบได้รับคำร้องขอยืมอุปกรณ์ของ ${name} เรียบร้อยแล้ว`,
  "approved": ({ name }) => `คำร้องขอยืมอุปกรณ์ของ ${name} ได้รับการอนุมัติแล้ว`,
  "rejected": ({ name }) => `คำร้องขอยืมอุปกรณ์ของ ${name} ไม่ได้รับการอนุมัติ`,
  "preparing-delivery": ({ name, equipmentType, dueOrReturnDate }) =>
    dueOrReturnDate
      ? `กำลังเตรียมจัดส่ง${equipmentType}ให้คุณ ${name} คาดว่าจะจัดส่งเสร็จภายใน ${daysRemaining(dueOrReturnDate)} วัน`
      : `กำลังเตรียมจัดส่ง${equipmentType}ให้คุณ ${name}`,
  "delivery-completed": ({ name, equipmentType, deliveryContactPhone }) =>
    `จัดส่ง${equipmentType}ให้คุณ ${name} สำเร็จแล้ว` +
    (deliveryContactPhone ? `\nหากมีข้อสงสัย ติดต่อได้ที่ ${deliveryContactPhone}` : ""),
  "return-due-soon": ({ name, equipmentType, dueOrReturnDate }) =>
    dueOrReturnDate
      ? `แจ้งเตือน: กำหนดคืน${equipmentType}ของ ${name} คือวันที่ ${formatThaiDate(dueOrReturnDate)} (อีก ${daysRemaining(dueOrReturnDate)} วัน)`
      : `${equipmentType}ของ ${name} ใกล้ถึงกำหนดคืน`,
  "returned": ({ name, equipmentType }) => `รับคืน${equipmentType}ของ ${name} เรียบร้อยแล้ว`,
}

export async function sendLineNotification(requestId: string, trigger: Trigger): Promise<boolean> {
  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: { select: { id: true, fullName: true, lineUserId: true } },
      assignedEquipmentItem: { select: { equipmentType: true } },
    },
  })
  if (!request) throw new Error(`Request ${requestId} not found`)

  const message = TEMPLATES[trigger]({
    name: request.patient.fullName,
    equipmentType: request.assignedEquipmentItem?.equipmentType ?? request.requestedEquipmentType,
    dueOrReturnDate: request.dueOrReturnDate,
    deliveryContactPhone: request.deliveryContactPhone,
  })
  const channelValue = request.patient.lineUserId
  const triggeredAt = new Date()

  if (!channelValue) {
    await db.notificationHistory.create({
      data: { patientId: request.patientId, requestId, channelType: "line-id",
        channelValue: "", trigger, deliveryStatus: "failed", message, triggeredAt,
        errorMessage: "ยังไม่ได้เชื่อมต่อ LINE" },
    })
    return false
  }

  try {
    await sendLinePushMessage(channelValue, message)
    await db.notificationHistory.create({
      data: { patientId: request.patientId, requestId, channelType: "line-id",
        channelValue, trigger, deliveryStatus: "sent", message, triggeredAt, deliveredAt: new Date() },
    })
    return true
  } catch (error) {
    await db.notificationHistory.create({
      data: { patientId: request.patientId, requestId, channelType: "line-id",
        channelValue, trigger, deliveryStatus: "failed", message, triggeredAt,
        errorMessage: error instanceof Error ? error.message : "Unknown error" },
    })
    throw error
  }
}
