import Link from "next/link"
import { ClipboardCheck, ClipboardList, Truck, ChevronRight, type LucideIcon } from "lucide-react"

export interface ActionQueueItem {
  href: string
  label: string
  count: number
  tone: "sky" | "violet" | "emerald"
}

const ICONS: Record<ActionQueueItem["tone"], LucideIcon> = {
  sky: ClipboardCheck,
  violet: ClipboardList,
  emerald: Truck,
}

const TONE: Record<ActionQueueItem["tone"], { icon: string; badge: string }> = {
  sky: { icon: "text-sky-600", badge: "bg-sky-50 text-sky-700" },
  violet: { icon: "text-violet-600", badge: "bg-violet-50 text-violet-700" },
  emerald: { icon: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
}

export function ActionQueue({ items }: { items: ActionQueueItem[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-gray-800">ต้องดำเนินการ</h2>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {items.map((item, i) => {
          const Icon = ICONS[item.tone]
          const tone = TONE[item.tone]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 " +
                (i < items.length - 1 ? "border-b border-gray-100" : "")
              }
            >
              <Icon className={"h-5 w-5 shrink-0 " + tone.icon} />
              <span className="flex-1 text-sm text-gray-900">{item.label}</span>
              <span className={"rounded-full px-2.5 py-0.5 text-xs font-semibold " + tone.badge}>
                {item.count}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
