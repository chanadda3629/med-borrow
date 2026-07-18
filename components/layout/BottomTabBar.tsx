"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FilePlus,
  ClipboardCheck,
  Package,
  PackagePlus,
  BarChart3,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = { href: string; label: string; Icon: LucideIcon }

const TABS: Tab[] = [
  { href: "/dashboard", label: "หน้าหลัก", Icon: LayoutDashboard },
  { href: "/requests/new", label: "รับคำร้อง", Icon: FilePlus },
  { href: "/requests", label: "ประเมิน", Icon: ClipboardCheck },
  { href: "/inventory", label: "คลังอุปกรณ์", Icon: Package },
  { href: "/inventory/new", label: "เพิ่มอุปกรณ์", Icon: PackagePlus },
  { href: "/reports", label: "รายงาน", Icon: BarChart3 },
]

// Pick the most specific tab whose href matches the current path, so that
// e.g. /requests/new highlights "รับคำร้อง" rather than "ประเมิน".
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
      <div className="pointer-events-auto mx-auto mb-[calc(0.5rem+env(safe-area-inset-bottom))] flex w-full max-w-md items-stretch justify-between gap-0.5 rounded-[26px] border border-black/5 bg-white/85 px-1.5 py-1.5 shadow-[0_10px_30px_-6px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = current === href
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-transform active:scale-95"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-gray-400 group-hover:text-gray-600 group-active:bg-gray-100"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[9px] leading-none tracking-tight transition-colors",
                  active ? "font-semibold text-blue-600" : "text-gray-400"
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
