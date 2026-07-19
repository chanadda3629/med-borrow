import Link from "next/link"
import { ClipboardCheck, ClipboardList, Truck, type LucideIcon } from "lucide-react"

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

const TONE: Record<
  ActionQueueItem["tone"],
  { icon: string; ring: string; count: string }
> = {
  sky: { icon: "text-sky-600", ring: "hover:border-sky-300", count: "text-sky-700" },
  violet: { icon: "text-violet-600", ring: "hover:border-violet-300", count: "text-violet-700" },
  emerald: { icon: "text-emerald-600", ring: "hover:border-emerald-300", count: "text-emerald-700" },
}

export function ActionQueue({ items }: { items: ActionQueueItem[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-gray-800">ต้องดำเนินการ</h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = ICONS[item.tone]
          const tone = TONE[item.tone]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-center shadow-sm transition-colors " +
                tone.ring
              }
            >
              <Icon className={"h-5 w-5 shrink-0 " + tone.icon} />
              <span className="text-xs font-medium leading-snug text-gray-700">
                {item.label}
              </span>
              <span className={"text-2xl font-bold tabular-nums " + tone.count}>
                {item.count}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
