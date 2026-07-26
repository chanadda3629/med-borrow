import { cn } from "@/lib/utils"
import {
  ClipboardCheck,
  Package,
  Truck,
  Home,
  type LucideIcon,
} from "lucide-react"

// Fulfillment-phase progress tracker (delivery-app style). Renders the four
// milestones from approval through the active loan, with the connecting bars
// filling as the request advances. Shown on the request detail page once a
// request reaches the อนุมัติ stage.
const MILESTONES: { status: string; label: string; icon: LucideIcon }[] = [
  { status: "อนุมัติ", label: "อนุมัติ", icon: ClipboardCheck },
  { status: "เตรียมจัดส่ง", label: "เตรียมจัดส่ง", icon: Package },
  { status: "จัดส่งสำเร็จ", label: "จัดส่งสำเร็จ", icon: Truck },
  { status: "รอคืน", label: "รับอุปกรณ์แล้ว", icon: Home },
]

// Statuses at/after the loan is fully active count every milestone as done.
const COMPLETED_STATUSES = ["คืนอุปกรณ์", "ปิดรายการ"]

const HEADLINES: Record<string, string> = {
  "อนุมัติ": "อนุมัติแล้ว รอเตรียมจัดส่ง",
  "เตรียมจัดส่ง": "กำลังเตรียมจัดส่งอุปกรณ์",
  "จัดส่งสำเร็จ": "จัดส่งอุปกรณ์สำเร็จแล้ว",
  "รอคืน": "อยู่ระหว่างการยืม (รอคืน)",
  "คืนอุปกรณ์": "รับคืนอุปกรณ์แล้ว",
  "ปิดรายการ": "ปิดรายการแล้ว",
}

export function DeliveryTracker({ currentStatus }: { currentStatus: string }) {
  const currentIdx = COMPLETED_STATUSES.includes(currentStatus)
    ? MILESTONES.length // everything done
    : MILESTONES.findIndex((m) => m.status === currentStatus)

  if (currentIdx < 0) return null

  const headline = HEADLINES[currentStatus] ?? "สถานะการจัดส่ง"

  return (
    <div className="space-y-3">
      <p className="text-base font-bold text-foreground">{headline}</p>
      <div className="flex items-center">
        {MILESTONES.map((milestone, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const Icon = milestone.icon
          const isLast = idx === MILESTONES.length - 1
          return (
            <div key={milestone.status} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                    isDone && "bg-success text-white",
                    isCurrent && "bg-accent-500 text-white ring-4 ring-accent-100",
                    !isDone && !isCurrent && "bg-hairline text-faint",
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center w-14",
                    isCurrent ? "text-accent-700 font-semibold" : isDone ? "text-success-text" : "text-faint",
                  )}
                >
                  {milestone.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 h-1 mx-1 mb-5 rounded-full bg-hairline overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      idx < currentIdx ? "w-full bg-success" : "w-0",
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
