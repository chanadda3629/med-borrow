import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"
import { LineConversationList, type ConversationSummary, type TimelineEntry } from "@/components/reports/LineConversationList"
import type { Trigger } from "@/lib/integrations/line/notification-service"

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function availableTriggersFor(request: { workflowStatus: string; approvalDecision: string | null }): Trigger[] {
  if (!request.approvalDecision) return ["approved", "rejected"]
  if (request.approvalDecision === "ไม่อนุมัติ") return []

  const triggers: Trigger[] = []
  if (["อนุมัติ", "เตรียมจัดส่ง"].includes(request.workflowStatus)) triggers.push("preparing-delivery")
  if (["เตรียมจัดส่ง", "จัดส่งสำเร็จ", "รอคืน"].includes(request.workflowStatus)) triggers.push("delivery-completed")
  if (["จัดส่งสำเร็จ", "รอคืน"].includes(request.workflowStatus)) triggers.push("return-due-soon")
  if (["รอคืน", "คืนอุปกรณ์"].includes(request.workflowStatus)) triggers.push("returned")
  return triggers
}

export default async function ReportsPage() {
  const [inventoryByType, patients] = await Promise.all([
    db.equipmentItem.groupBy({ by: ["equipmentType", "currentStatus"], _count: { id: true } }),
    db.patient.findMany({
      where: { OR: [{ lineUserId: { not: null } }, { notifications: { some: {} } }] },
      include: {
        borrowingRequests: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: { assignedEquipmentItem: { select: { equipmentType: true } } },
        },
        notifications: { orderBy: { triggeredAt: "desc" } },
        lineMessages: { orderBy: { createdAt: "desc" } },
      },
      take: 30,
    }),
  ])

  const typeStats = EQUIPMENT_TYPES.map((type) => {
    const rows = inventoryByType.filter((r) => r.equipmentType === type)
    const available = rows.find((r) => r.currentStatus === "พร้อมใช้งาน")?._count.id ?? 0
    const onLoan = rows.find((r) => r.currentStatus === "ถูกยืม")?._count.id ?? 0
    const damaged = rows.find((r) => r.currentStatus === "ชำรุด")?._count.id ?? 0
    const total = rows.reduce((s, r) => s + r._count.id, 0)
    return { type, available, onLoan, damaged, total }
  }).filter((t) => t.total > 0)

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
              equipmentType: activeRequest.assignedEquipmentItem?.equipmentType ?? activeRequest.requestedEquipmentType,
              dueOrReturnDate: dueDate ? dueDate.toISOString() : null,
              daysRemaining: dueDate ? daysUntil(dueDate) : null,
              availableTriggers: availableTriggersFor(activeRequest),
            }
          : null,
        timeline,
      }
    })
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))

  return (
    <div>
      <PageHeader title="รายงาน" />
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader><CardTitle>สรุปคลังอุปกรณ์ตามประเภท</CardTitle></CardHeader>
          <CardContent className="p-0">
            {typeStats.length === 0 ? (
              <p className="p-4 text-sm text-faint">ยังไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-hairline">
                  <th className="text-left px-4 py-2 text-muted">ประเภท</th>
                  <th className="text-right px-4 py-2 text-success">พร้อม</th>
                  <th className="text-right px-4 py-2 text-info">ยืม</th>
                  <th className="text-right px-4 py-2 text-danger">ชำรุด</th>
                </tr></thead>
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ประวัติการแจ้งเตือน LINE</CardTitle></CardHeader>
          <CardContent className="p-0">
            <LineConversationList conversations={conversations} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
