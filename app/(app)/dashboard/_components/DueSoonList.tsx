import Link from "next/link"
import { CalendarClock } from "lucide-react"

export interface DueSoonItem {
  id: string
  href: string
  patientName: string
  equipmentLabel: string
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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-400">
            <CalendarClock className="h-4 w-4" />
            ยังไม่มีรายการใกล้ครบกำหนด
          </div>
        ) : (
          items.map((item, i) => {
            const badge = dueBadge(item.daysRemaining)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 " +
                  (i < items.length - 1 ? "border-b border-gray-100" : "")
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.patientName}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">{item.equipmentLabel}</p>
                </div>
                <span className={"shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " + badge.className}>
                  {badge.text}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </section>
  )
}
