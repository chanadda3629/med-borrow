import Link from "next/link"
import { ClipboardCheck, ClipboardList, Truck, type LucideIcon } from "lucide-react"
import { ROLE_ICON_TINT } from "@/components/shared/StatusBadge"

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

// Each queue corresponds to a workflow status; map its tone to that status's
// semantic role (DESIGN.md §2.4) for the leading icon tint. The count itself
// stays neutral so status color never competes with the number.
const TONE_ROLE: Record<ActionQueueItem["tone"], keyof typeof ROLE_ICON_TINT> = {
  sky: "info",
  violet: "info",
  emerald: "success",
}

export function ActionQueue({ items }: { items: ActionQueueItem[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">ต้องดำเนินการ</h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = ICONS[item.tone]
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 rounded-lg bg-surface p-3 text-center shadow-sm transition-all duration-150 ease-apple hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
            >
              <span
                className={
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                  ROLE_ICON_TINT[TONE_ROLE[item.tone]]
                }
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium leading-snug text-muted">
                {item.label}
              </span>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {item.count}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
