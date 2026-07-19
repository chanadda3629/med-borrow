import Link from "next/link"
import { CalendarClock } from "lucide-react"
import { EquipmentIcon } from "./equipment-icons"

export interface DueSoonItem {
  id: string
  href: string
  patientName: string
  equipmentType: string
  assetNumber: string | null
  daysRemaining: number
}

function dueBadge(days: number): { text: string; className: string } {
  if (days < 0) return { text: `เกิน ${Math.abs(days)} วัน`, className: "bg-red-50 text-red-700" }
  if (days === 0) return { text: "ครบกำหนดวันนี้", className: "bg-red-50 text-red-700" }
  if (days <= 3) return { text: `อีก ${days} วัน`, className: "bg-amber-50 text-amber-700" }
  return { text: `อีก ${days} วัน`, className: "bg-gray-100 text-gray-600" }
}

export function DueSoonList({ items }: { items: DueSoonItem[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">ใกล้ครบกำหนดคืน</h2>
        <Link href="/requests?status=รอคืน" className="text-xs font-medium text-blue-600">
          ดูทั้งหมด
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-400 shadow-sm">
          <CalendarClock className="h-4 w-4" />
          ยังไม่มีรายการใกล้ครบกำหนด
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const badge = dueBadge(item.daysRemaining)
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                    {item.patientName}
                  </p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                    <EquipmentIcon type={item.equipmentType} className="h-4 w-4" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-600">{item.equipmentType}</p>
                  {item.assetNumber && (
                    <p className="truncate text-xs text-gray-400">{item.assetNumber}</p>
                  )}
                </div>
                <span
                  className={
                    "mt-auto w-fit rounded-full px-2.5 py-1 text-xs font-semibold " + badge.className
                  }
                >
                  {badge.text}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
