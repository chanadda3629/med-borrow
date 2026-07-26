import { getSession } from "@/lib/auth/get-session"
import { toThaiEquipmentType, toThaiEquipmentStatus } from "@/lib/domain/labels"
import {
  getQueueCounts,
  getDueSoonLoans,
  getOverdueCount,
  getInventoryGroups,
} from "../_data"
import { DashboardHeader } from "./DashboardHeader"
import { ActionQueue, type ActionQueueItem } from "./ActionQueue"
import { DueSoonList, type DueSoonItem } from "./DueSoonList"
import { InventoryStatus, type InventoryStatusRow } from "./InventoryStatus"

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "สวัสดีตอนเช้า"
  if (hour >= 12 && hour < 17) return "สวัสดีตอนบ่าย"
  if (hour >= 17 && hour < 21) return "สวัสดีตอนเย็น"
  return "สวัสดีตอนดึก"
}

export async function DashboardHeaderSection() {
  const [session, overdueCount] = await Promise.all([getSession(), getOverdueCount()])
  const now = new Date()

  const bangkokHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Bangkok",
    }).format(now),
  )
  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(now)
  const role = (session.user as { role?: string }).role

  return (
    <DashboardHeader
      greeting={greetingFor(bangkokHour)}
      roleLabel={role === "ADMIN" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}
      dateLabel={dateLabel}
      alertCount={overdueCount}
    />
  )
}

export async function ActionQueueSection() {
  const { assess, approval, delivery } = await getQueueCounts()

  const items: ActionQueueItem[] = [
    { href: "/requests?status=ประเมินผู้ป่วย", label: "คำร้องที่รอประเมิน", count: assess, tone: "sky" },
    { href: "/requests?status=ตรวจสอบคลังอุปกรณ์", label: "รออนุมัติจ่ายอุปกรณ์", count: approval, tone: "violet" },
    { href: "/requests?status=อนุมัติ", label: "รอจัดส่ง", count: delivery, tone: "emerald" },
  ]

  return <ActionQueue items={items} />
}

export async function DueSoonSection() {
  const loans = await getDueSoonLoans()

  const items: DueSoonItem[] = loans.map((req) => {
    const item = req.assignedEquipmentItem
    return {
      id: req.id,
      href: `/requests/${req.id}`,
      patientName: req.patient.fullName,
      equipmentType: toThaiEquipmentType(item?.equipmentType ?? req.requestedEquipmentType),
      assetNumber: item?.assetNumber ?? null,
      daysRemaining: daysUntil(req.dueOrReturnDate!),
    }
  })

  return <DueSoonList items={items} />
}

export async function InventoryStatusSection() {
  const groups = await getInventoryGroups()

  const invMap = new Map<string, { available: number; total: number }>()
  for (const g of groups) {
    const type = toThaiEquipmentType(g.equipmentType)
    const status = toThaiEquipmentStatus(g.currentStatus)
    const row = invMap.get(type) ?? { available: 0, total: 0 }
    row.total += g._count.id
    if (status === "พร้อมใช้งาน") row.available += g._count.id
    invMap.set(type, row)
  }

  const rows: InventoryStatusRow[] = [...invMap.entries()]
    .map(([type, v]) => ({ type, available: v.available, total: v.total }))
    .sort((a, b) => a.available / a.total - b.available / b.total)

  return <InventoryStatus rows={rows} />
}
