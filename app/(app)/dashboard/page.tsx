import { db } from "@/lib/db"
import { getSession } from "@/lib/auth/get-session"
import { toThaiEquipmentType, toThaiEquipmentStatus } from "@/lib/domain/labels"
import { QuickActionsGrid } from "./_components/QuickActionsGrid"
import { DashboardHeader } from "./_components/DashboardHeader"
import { ActionQueue, type ActionQueueItem } from "./_components/ActionQueue"
import { DueSoonList, type DueSoonItem } from "./_components/DueSoonList"
import { InventoryStatus, type InventoryStatusRow } from "./_components/InventoryStatus"

// Stored workflow/status values may be Thai labels (written by the app) or legacy
// English reference codes (seed data). Match both when bucketing counts.
const ASSESS = ["ประเมินผู้ป่วย", "assessing_patient"]
const AWAITING_APPROVAL = ["ตรวจสอบคลังอุปกรณ์", "inventory_check"]
const AWAITING_DELIVERY = ["อนุมัติ", "เตรียมจัดส่ง", "approved", "preparing_delivery"]
const ACTIVE_LOAN = ["จัดส่งสำเร็จ", "รอคืน", "delivered", "awaiting_return"]

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "สวัสดีตอนเช้า"
  if (hour >= 12 && hour < 17) return "สวัสดีตอนบ่าย"
  if (hour >= 17 && hour < 21) return "สวัสดีตอนเย็น"
  return "สวัสดีตอนดึก"
}

export default async function DashboardPage() {
  const session = await getSession()
  const now = new Date()

  const bangkokHour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok" }).format(now)
  )
  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(now)
  const role = (session.user as { role?: string }).role
  const roleLabel = role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"

  const [assessCount, approvalCount, deliveryCount, activeLoans, inventoryGroups] = await Promise.all([
    db.borrowingRequest.count({ where: { workflowStatus: { in: ASSESS } } }),
    db.borrowingRequest.count({ where: { workflowStatus: { in: AWAITING_APPROVAL } } }),
    db.borrowingRequest.count({ where: { workflowStatus: { in: AWAITING_DELIVERY } } }),
    db.borrowingRequest.findMany({
      where: { workflowStatus: { in: ACTIVE_LOAN }, dueOrReturnDate: { not: null } },
      orderBy: { dueOrReturnDate: "asc" },
      include: {
        patient: { select: { fullName: true } },
        assignedEquipmentItem: { select: { equipmentType: true, assetNumber: true } },
      },
    }),
    db.equipmentItem.groupBy({ by: ["equipmentType", "currentStatus"], _count: { id: true } }),
  ])

  const actionItems: ActionQueueItem[] = [
    { href: "/requests?status=ประเมินผู้ป่วย", label: "คำร้องที่รอประเมิน", count: assessCount, tone: "sky" },
    { href: "/requests?status=ตรวจสอบคลังอุปกรณ์", label: "รออนุมัติจ่ายอุปกรณ์", count: approvalCount, tone: "violet" },
    { href: "/requests?status=อนุมัติ", label: "รอจัดส่ง", count: deliveryCount, tone: "emerald" },
  ]

  const dueItems: DueSoonItem[] = activeLoans.map((req) => {
    const item = req.assignedEquipmentItem
    const type = toThaiEquipmentType(item?.equipmentType ?? req.requestedEquipmentType)
    return {
      id: req.id,
      href: `/requests/${req.id}`,
      patientName: req.patient.fullName,
      equipmentType: type,
      assetNumber: item?.assetNumber ?? null,
      daysRemaining: daysUntil(req.dueOrReturnDate!),
    }
  })
  const overdueCount = dueItems.filter((d) => d.daysRemaining < 0).length
  const dueItemsTop = dueItems.slice(0, 5)

  const invMap = new Map<string, { available: number; total: number }>()
  for (const g of inventoryGroups) {
    const type = toThaiEquipmentType(g.equipmentType)
    const status = toThaiEquipmentStatus(g.currentStatus)
    const row = invMap.get(type) ?? { available: 0, total: 0 }
    row.total += g._count.id
    if (status === "พร้อมใช้งาน") row.available += g._count.id
    invMap.set(type, row)
  }
  const inventoryRows: InventoryStatusRow[] = [...invMap.entries()]
    .map(([type, v]) => ({ type, available: v.available, total: v.total }))
    .sort((a, b) => a.available / a.total - b.available / b.total)

  return (
    <div className="pb-4">
      <DashboardHeader
        greeting={greetingFor(bangkokHour)}
        roleLabel={roleLabel}
        dateLabel={dateLabel}
        alertCount={overdueCount}
      />
      <div className="space-y-6 p-4">
        <QuickActionsGrid />
        <ActionQueue items={actionItems} />
        <DueSoonList items={dueItemsTop} />
        <InventoryStatus rows={inventoryRows} />
      </div>
    </div>
  )
}
