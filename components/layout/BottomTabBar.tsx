"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ClipboardList, Users, Package, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", label: "หน้าหลัก", Icon: LayoutDashboard },
  { href: "/requests", label: "คำร้อง", Icon: ClipboardList },
  { href: "/patients", label: "ผู้ป่วย", Icon: Users },
  { href: "/inventory", label: "คลัง", Icon: Package },
  { href: "/reports", label: "รายงาน", Icon: BarChart3 },
]

export function BottomTabBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
      <div className="flex items-center h-16">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
