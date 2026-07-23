// Pull model: patients tap a Rich Menu / quick-reply button and the bot answers
// with a FREE reply token (see line-messaging-design). This module builds those
// reply messages. No push quota is consumed — everything here is patient-initiated.
import { db } from "@/lib/db"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import type { LineMessage, LineQuickReply } from "./line-client"

// Terminal statuses are hidden from the "active requests" view.
const TERMINAL_STATUSES = new Set(["ไม่อนุมัติ", "ปิดรายการ"])

// Postback data strings emitted by the Rich Menu / quick-reply buttons. The
// webhook matches inbound events against these (and their Thai labels, for a
// Rich Menu configured with text actions).
export const PULL_ACTIONS = {
  status: "action=status",
  due: "action=due",
  contact: "action=contact",
} as const

export const PULL_LABELS = {
  status: "เช็คสถานะ",
  due: "วันครบกำหนด",
  contact: "ติดต่อเจ้าหน้าที่",
} as const

function formatThaiDate(date: Date): string {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
}

function daysRemaining(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

// The always-attached quick-reply bar so elderly users can keep tapping rather
// than typing. Layered on top of the persistent Rich Menu.
function pullQuickReply(): LineQuickReply {
  return {
    items: [
      { type: "action", action: { type: "postback", label: PULL_LABELS.status, data: PULL_ACTIONS.status, displayText: PULL_LABELS.status } },
      { type: "action", action: { type: "postback", label: PULL_LABELS.due, data: PULL_ACTIONS.due, displayText: PULL_LABELS.due } },
      { type: "action", action: { type: "postback", label: PULL_LABELS.contact, data: PULL_ACTIONS.contact, displayText: PULL_LABELS.contact } },
    ],
  }
}

function withQuickReply(text: string): LineMessage[] {
  return [{ type: "text", text, quickReply: pullQuickReply() }]
}

type PatientRef = { id: string; fullName: string }

async function activeRequests(patientId: string) {
  const requests = await db.borrowingRequest.findMany({
    where: { patientId },
    include: { assignedEquipmentItem: { select: { equipmentType: true } } },
    orderBy: { createdAt: "desc" },
  })
  return requests.filter((r) => !TERMINAL_STATUSES.has(toThaiWorkflowStatus(r.workflowStatus)))
}

// เช็คสถานะ — current status of every active request the patient has.
export async function buildStatusReply(patient: PatientRef): Promise<LineMessage[]> {
  const requests = await activeRequests(patient.id)
  if (requests.length === 0) {
    return withQuickReply(`ขณะนี้ยังไม่มีคำร้องที่กำลังดำเนินการของ ${patient.fullName}`)
  }

  const lines = requests.map((r) => {
    const equipment = r.assignedEquipmentItem?.equipmentType ?? (r.requestedEquipmentType || "อุปกรณ์")
    const status = toThaiWorkflowStatus(r.workflowStatus)
    const due = r.dueOrReturnDate ? ` (กำหนดคืน ${formatThaiDate(r.dueOrReturnDate)})` : ""
    return `• ${equipment} — ${status}${due}`
  })
  return withQuickReply(`สถานะคำร้องของ ${patient.fullName}:\n${lines.join("\n")}`)
}

// วันครบกำหนด — due dates for requests that have one set.
export async function buildDueReply(patient: PatientRef): Promise<LineMessage[]> {
  const requests = (await activeRequests(patient.id)).filter((r) => r.dueOrReturnDate)
  if (requests.length === 0) {
    return withQuickReply(`ขณะนี้ยังไม่มีกำหนดคืนอุปกรณ์ของ ${patient.fullName}`)
  }

  const lines = requests.map((r) => {
    const equipment = r.assignedEquipmentItem?.equipmentType ?? (r.requestedEquipmentType || "อุปกรณ์")
    const due = r.dueOrReturnDate!
    const remaining = daysRemaining(due)
    const remainingText = remaining >= 0 ? `อีก ${remaining} วัน` : `เกินกำหนด ${Math.abs(remaining)} วัน`
    return `• ${equipment} — ${formatThaiDate(due)} (${remainingText})`
  })
  return withQuickReply(`กำหนดคืนอุปกรณ์ของ ${patient.fullName}:\n${lines.join("\n")}`)
}

// ติดต่อเจ้าหน้าที่ — reply the center hotline instantly (free). The webhook also
// logs the request as an inbound message so staff can follow up asynchronously.
export function buildContactReply(): LineMessage[] {
  const hotline = process.env.LINE_STAFF_HOTLINE
  const text = hotline
    ? `ติดต่อเจ้าหน้าที่ศูนย์ได้ที่ ${hotline}\nเจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด`
    : "เจ้าหน้าที่ได้รับข้อความของท่านแล้ว และจะติดต่อกลับโดยเร็วที่สุด"
  return withQuickReply(text)
}

// An LINE friend who hasn't been account-linked to a patient record. Never leak
// patient data — prompt them to register with staff instead.
export function buildUnlinkedReply(): LineMessage[] {
  return withQuickReply(
    "กรุณาลงทะเบียนเชื่อมต่อ LINE กับเจ้าหน้าที่ก่อนใช้งาน\nโดยให้เจ้าหน้าที่แสดง QR สำหรับเพิ่มเพื่อนและเชื่อมบัญชี",
  )
}

// follow event (friend added) — free welcome + the quick-reply bar to get started.
export function buildWelcomeReply(): LineMessage[] {
  return withQuickReply(
    "ยินดีต้อนรับสู่ระบบยืมอุปกรณ์การแพทย์\nแตะปุ่มด้านล่างเพื่อเช็คสถานะคำร้อง ดูวันครบกำหนด หรือติดต่อเจ้าหน้าที่",
  )
}
