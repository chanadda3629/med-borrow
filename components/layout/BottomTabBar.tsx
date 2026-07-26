"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  BarChart3,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = { href: string; label: string; Icon: LucideIcon }

// Four top-level sections only (DESIGN.md §8). Create actions ("รับคำร้อง",
// "เพิ่มอุปกรณ์") live as primary buttons inside their section, not as tabs.
const TABS: Tab[] = [
  { href: "/dashboard", label: "หน้าหลัก", Icon: LayoutDashboard },
  { href: "/requests", label: "คำร้อง", Icon: ClipboardList },
  { href: "/inventory", label: "คลังอุปกรณ์", Icon: Package },
  { href: "/reports", label: "รายงาน", Icon: BarChart3 },
]

// Pick the most specific tab whose href matches the current path, so nested
// routes (e.g. /requests/new, /requests/[id]) keep "คำร้อง" highlighted.
function activeHref(pathname: string): string | null {
  let best: string | null = null
  for (const { href } of TABS) {
    if (pathname === href || pathname.startsWith(href + "/")) {
      if (!best || href.length > best.length) best = href
    }
  }
  return best
}

export function BottomTabBar() {
  const pathname = usePathname()
  const current = activeHref(pathname)

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3">
      <div className="glass pointer-events-auto mx-auto mb-[calc(0.5rem+env(safe-area-inset-bottom))] flex w-full max-w-md items-stretch justify-between gap-1 rounded-full border border-black/[0.06] px-2 py-2 shadow-lg">
        {TABS.map(({ href, label, Icon }) => {
          const active = current === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full py-1 transition-transform duration-150 ease-apple active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  active ? "text-accent-500" : "text-muted group-hover:text-foreground",
                )}
                strokeWidth={active ? 2 : 1.75}
              />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] leading-none tracking-tight transition-colors",
                  active ? "font-semibold text-accent-500" : "text-muted",
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
