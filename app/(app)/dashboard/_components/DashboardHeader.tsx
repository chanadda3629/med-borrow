import Link from "next/link"
import { Bell } from "lucide-react"

interface DashboardHeaderProps {
  greeting: string
  roleLabel: string
  dateLabel: string
  alertCount: number
}

export function DashboardHeader({ greeting, roleLabel, dateLabel, alertCount }: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-2">
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{greeting}</p>
        <p className="mt-0.5 text-lg font-semibold text-gray-900 truncate">{roleLabel}</p>
        <p className="mt-0.5 text-xs text-gray-400">{dateLabel}</p>
      </div>
      <Link
        href="/reports"
        aria-label="การแจ้งเตือน"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
      >
        <Bell className="h-5 w-5" />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {alertCount > 99 ? "99+" : alertCount}
          </span>
        )}
      </Link>
    </header>
  )
}
