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
  if (days < 0) return { text: `เกิน ${Math.abs(days)} วัน`, className: "bg-danger-soft text-danger-text" }
  if (days === 0) return { text: "ครบกำหนดวันนี้", className: "bg-danger-soft text-danger-text" }
  if (days <= 3) return { text: `อีก ${days} วัน`, className: "bg-warning-soft text-warning-text" }
  return { text: `อีก ${days} วัน`, className: "bg-surface-2 text-muted" }
}

export function DueSoonList({ items }: { items: DueSoonItem[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">ใกล้ครบกำหนดคืน</h2>
        <Link href="/requests?status=รอคืน" className="text-xs font-medium text-accent-600">
          ดูทั้งหมด
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-surface px-4 py-6 text-sm text-faint shadow-sm">
          <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
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
                className="flex flex-col gap-2 rounded-lg bg-surface p-3 shadow-sm transition-all duration-150 ease-apple hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {item.patientName}
                  </p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
                    <EquipmentIcon type={item.equipmentType} className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted">{item.equipmentType}</p>
                  {item.assetNumber && (
                    <p className="truncate text-xs text-faint">{item.assetNumber}</p>
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
