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
        <p className="text-sm text-muted">{greeting}</p>
        <p className="mt-0.5 text-lg font-semibold text-foreground truncate">{roleLabel}</p>
        <p className="mt-0.5 text-xs text-faint">{dateLabel}</p>
      </div>
      <Link
        href="/reports"
        aria-label="การแจ้งเตือน"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700 transition-all duration-150 ease-apple hover:bg-accent-100 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {alertCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {alertCount > 99 ? "99+" : alertCount}
          </span>
        )}
      </Link>
    </header>
  )
}
