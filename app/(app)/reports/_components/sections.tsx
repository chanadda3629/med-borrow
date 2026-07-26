import { db } from "@/lib/db"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"
import {
  LineConversationList,
  type ConversationSummary,
  type TimelineEntry,
} from "@/components/reports/LineConversationList"
import type { Trigger } from "@/lib/integrations/line/notification-service"

/** Most recent messages/notifications kept per patient when building a timeline. */
const TIMELINE_LIMIT = 100

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function availableTriggersFor(request: {
  workflowStatus: string
  approvalDecision: string | null
}): Trigger[] {
  if (!request.approvalDecision) return ["approved", "rejected"]
  if (request.approvalDecision === "ไม่อนุมัติ") return []

  const triggers: Trigger[] = []
  if (["อนุมัติ", "เตรียมจัดส่ง"].includes(request.workflowStatus)) triggers.push("preparing-delivery")
  if (["เตรียมจัดส่ง", "จัดส่งสำเร็จ", "รอคืน"].includes(request.workflowStatus)) triggers.push("delivery-completed")
  if (["จัดส่งสำเร็จ", "รอคืน"].includes(request.workflowStatus)) triggers.push("return-due-soon")
  if (["รอคืน", "คืนอุปกรณ์"].includes(request.workflowStatus)) triggers.push("returned")
  return triggers
}

/** Inventory summary table — a single groupBy, so it lands well before the
 *  conversation timelines and gets its own boundary to prove it. */
export async function InventorySummarySection() {
  const inventoryByType = await db.equipmentItem.groupBy({
    by: ["equipmentType", "currentStatus"],
    _count: { id: true },
  })

  const typeStats = EQUIPMENT_TYPES.map((type) => {
    const rows = inventoryByType.filter((r) => r.equipmentType === type)
    const available = rows.find((r) => r.currentStatus === "พร้อมใช้งาน")?._count.id ?? 0
    const onLoan = rows.find((r) => r.currentStatus === "ถูกยืม")?._count.id ?? 0
    const damaged = rows.find((r) => r.currentStatus === "ชำรุด")?._count.id ?? 0
    const total = rows.reduce((s, r) => s + r._count.id, 0)
    return { type, available, onLoan, damaged, total }
  }).filter((t) => t.total > 0)

  if (typeStats.length === 0) {
    return <p className="p-4 text-sm text-faint">ยังไม่มีข้อมูล</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-hairline">
          <th className="text-left px-4 py-2 text-muted">ประเภท</th>
          <th className="text-right px-4 py-2 text-success">พร้อม</th>
          <th className="text-right px-4 py-2 text-info">ยืม</th>
          <th className="text-right px-4 py-2 text-danger">ชำรุด</th>
        </tr>
      </thead>
      <tbody>
        {typeStats.map((t) => (
          <tr key={t.type} className="border-b border-hairline">
            <td className="px-4 py-3 font-medium text-foreground">{t.type}</td>
            <td className="px-4 py-3 text-right text-success-text">{t.available}</td>
            <td className="px-4 py-3 text-right text-info-text">{t.onLoan}</td>
            <td className="px-4 py-3 text-right text-danger-text">{t.damaged}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The heaviest query in the app: 30 patients, each with their notification and
 *  LINE-message history. Both child collections are capped so one long-running
 *  conversation cannot balloon the payload. */
export async function LineConversationsSection() {
  const patients = await db.patient.findMany({
    where: { OR: [{ lineUserId: { not: null } }, { notifications: { some: {} } }] },
    take: 30,
    select: {
      id: true,
      fullName: true,
      lineUserId: true,
      createdAt: true,
      borrowingRequests: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          id: true,
          workflowStatus: true,
          approvalDecision: true,
          requestedEquipmentType: true,
          dueOrReturnDate: true,
          assignedEquipmentItem: { select: { equipmentType: true } },
        },
      },
      notifications: {
        orderBy: { triggeredAt: "desc" },
        take: TIMELINE_LIMIT,
        select: { id: true, message: true, deliveryStatus: true, triggeredAt: true },
      },
      lineMessages: {
        orderBy: { createdAt: "desc" },
        take: TIMELINE_LIMIT,
        select: { id: true, body: true, direction: true, deliveryStatus: true, createdAt: true },
      },
    },
  })

  const conversations: ConversationSummary[] = patients
    .map((p) => {
      const activeRequest = p.borrowingRequests[0] ?? null
      const timeline: TimelineEntry[] = [
        ...p.notifications.map((n) => ({
          id: n.id,
          kind: "notification" as const,
          direction: "outbound" as const,
          body: n.message,
          deliveryStatus: n.deliveryStatus,
          createdAt: n.triggeredAt.toISOString(),
        })),
        ...p.lineMessages.map((m) => ({
          id: m.id,
          kind: "chat" as const,
          direction: m.direction as "inbound" | "outbound",
          body: m.body,
          deliveryStatus: m.deliveryStatus,
          createdAt: m.createdAt.toISOString(),
        })),
      ].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

      const lastEntry = timeline[timeline.length - 1]
      const dueDate = activeRequest?.dueOrReturnDate ?? null

      return {
        patientId: p.id,
        fullName: p.fullName,
        linked: !!p.lineUserId,
        lastActivityAt: lastEntry?.createdAt ?? p.createdAt.toISOString(),
        lastMessagePreview: lastEntry?.body ?? "ยังไม่มีข้อความ",
        activeRequest: activeRequest
          ? {
              id: activeRequest.id,
              workflowStatus: activeRequest.workflowStatus,
              approvalDecision: activeRequest.approvalDecision,
              equipmentType:
                activeRequest.assignedEquipmentItem?.equipmentType ??
                activeRequest.requestedEquipmentType,
              dueOrReturnDate: dueDate ? dueDate.toISOString() : null,
              daysRemaining: dueDate ? daysUntil(dueDate) : null,
              availableTriggers: availableTriggersFor(activeRequest),
            }
          : null,
        timeline,
      }
    })
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))

  return <LineConversationList conversations={conversations} />
}
