// Pull model: patients tap a Rich Menu / quick-reply button and the bot answers
// with a FREE reply token (see line-messaging-design). This module builds those
// reply messages. No push quota is consumed — everything here is patient-initiated.
import { db } from "@/lib/db"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import type { LineMessage, LineQuickReply, LineQuickReplyItem } from "./line-client"
import type { LinkFailureReason } from "./link-code"

// Terminal statuses are hidden from the "active requests" view.
const TERMINAL_STATUSES = new Set(["ไม่อนุมัติ", "ปิดรายการ"])

// Postback data strings emitted by the Rich Menu / quick-reply buttons. The
// webhook matches inbound events against these (and their Thai labels, for a
// Rich Menu configured with text actions).
export const PULL_ACTIONS = {
  status: "action=status",
  due: "action=due",
  contact: "action=contact",
  register: "action=register",
  unlink: "action=unlink",
} as const

export const PULL_LABELS = {
  status: "เช็คสถานะ",
  due: "วันครบกำหนด",
  contact: "ติดต่อเจ้าหน้าที่",
  register: "ลงทะเบียน",
  unlink: "ออกจากระบบ",
} as const

function formatThaiDate(date: Date): string {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
}

function daysRemaining(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function quickReplyItem(label: string, data: string): LineQuickReplyItem {
  return { type: "action", action: { type: "postback", label, data, displayText: label } }
}

// The always-attached quick-reply bar so elderly users can keep tapping rather
// than typing. Layered on top of the persistent Rich Menu. LINE caps it at 13
// items. An unlinked user only gets ลงทะเบียน — every other action would just
// answer "you are not linked yet".
function pullQuickReply(linked: boolean): LineQuickReply {
  if (!linked) {
    return { items: [quickReplyItem(PULL_LABELS.register, PULL_ACTIONS.register)] }
  }
  return {
    items: [
      quickReplyItem(PULL_LABELS.status, PULL_ACTIONS.status),
      quickReplyItem(PULL_LABELS.due, PULL_ACTIONS.due),
      quickReplyItem(PULL_LABELS.contact, PULL_ACTIONS.contact),
      quickReplyItem(PULL_LABELS.unlink, PULL_ACTIONS.unlink),
    ],
  }
}

function withQuickReply(text: string, linked = true): LineMessage[] {
  return [{ type: "text", text, quickReply: pullQuickReply(linked) }]
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

// A LINE friend who hasn't been linked to a patient record. Never leak patient
// data — tell them how to register instead.
export function buildUnlinkedReply(): LineMessage[] {
  return withQuickReply(
    "ยังไม่ได้เชื่อมต่อกับข้อมูลผู้ป่วย\nขอรหัสเชื่อมต่อ 6 หลักจากเจ้าหน้าที่ แล้วพิมพ์รหัสส่งมาในแชทนี้",
    false,
  )
}

// ลงทะเบียน — the one action an unlinked friend can take.
export function buildRegisterReply(): LineMessage[] {
  return withQuickReply(
    "วิธีเชื่อมต่อ:\n1. ขอรหัสเชื่อมต่อ 6 หลักจากเจ้าหน้าที่\n2. พิมพ์รหัสนั้นส่งมาในแชทนี้\n\nรหัสมีอายุ 30 นาที",
    false,
  )
}

// follow event (friend added) — free welcome + the quick-reply bar to get started.
// A returning friend who is still linked skips the registration instructions.
export function buildWelcomeReply(linked: boolean): LineMessage[] {
  if (linked) {
    return withQuickReply(
      "ยินดีต้อนรับสู่ระบบยืมอุปกรณ์การแพทย์\nแตะปุ่มด้านล่างเพื่อเช็คสถานะคำร้อง ดูวันครบกำหนด หรือติดต่อเจ้าหน้าที่",
    )
  }
  return withQuickReply(
    "ยินดีต้อนรับสู่ระบบยืมอุปกรณ์การแพทย์\nขอรหัสเชื่อมต่อ 6 หลักจากเจ้าหน้าที่ แล้วพิมพ์รหัสส่งมาในแชทนี้เพื่อเริ่มใช้งาน",
    false,
  )
}

export function buildLinkSuccessReply(patientName: string, transferred: boolean): LineMessage[] {
  const moved = transferred
    ? "\n(ระบบได้ย้ายการเชื่อมต่อจากผู้ป่วยรายเดิมมาที่รายนี้แล้ว)"
    : ""
  return withQuickReply(
    `เชื่อมต่อสำเร็จ\nบัญชี LINE นี้เชื่อมกับข้อมูลของ ${patientName} แล้ว${moved}\n\nแตะปุ่มด้านล่างเพื่อเช็คสถานะคำร้องหรือวันครบกำหนด`,
  )
}

export function buildLinkFailedReply(reason: LinkFailureReason): LineMessage[] {
  if (reason === "expired") {
    return withQuickReply("รหัสนี้หมดอายุแล้ว\nกรุณาขอรหัสใหม่จากเจ้าหน้าที่", false)
  }
  if (reason === "locked") {
    return withQuickReply("กรอกรหัสผิดหลายครั้งเกินไป\nกรุณารอ 15 นาที แล้วลองใหม่อีกครั้ง", false)
  }
  return withQuickReply("รหัสไม่ถูกต้องหรือถูกใช้ไปแล้ว\nกรุณาตรวจสอบกับเจ้าหน้าที่อีกครั้ง", false)
}

// ออกจากระบบ — confirm the unbinding and drop back to the unlinked bar.
export function buildUnlinkDoneReply(): LineMessage[] {
  return withQuickReply(
    "ยกเลิกการเชื่อมต่อแล้ว\nบัญชี LINE นี้จะไม่ได้รับการแจ้งเตือนอีก\nหากต้องการเชื่อมต่อใหม่ ขอรหัสจากเจ้าหน้าที่ได้เลย",
    false,
  )
}
