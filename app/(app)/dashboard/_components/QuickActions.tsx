import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { UserPlus, Inbox, ClipboardCheck, Package, PackagePlus } from "lucide-react"

interface Action {
  href: string
  label: string
  Icon: LucideIcon
  gradient: string
}

const PRIMARY_ACTIONS: Action[] = [
  {
    href: "/patients/new",
    label: "ลงทะเบียนผู้ป่วยใหม่",
    Icon: UserPlus,
    gradient: "from-rose-400 to-pink-500",
  },
  {
    href: "/requests?status=รับคำร้อง",
    label: "รับคำร้อง",
    Icon: Inbox,
    gradient: "from-violet-400 to-purple-600",
  },
]

const SECONDARY_ACTIONS: Action[] = [
  {
    href: "/requests?status=ประเมินผู้ป่วย",
    label: "ประเมินคำร้อง",
    Icon: ClipboardCheck,
    gradient: "from-sky-400 to-blue-500",
  },
  {
    href: "/inventory",
    label: "คลังอุปกรณ์",
    Icon: Package,
    gradient: "from-amber-300 to-orange-400",
  },
  {
    href: "/inventory/new",
    label: "เพิ่มอุปกรณ์",
    Icon: PackagePlus,
    gradient: "from-emerald-400 to-green-600",
  },
]

function Tile({ href, label, Icon, gradient, size }: Action & { size: "lg" | "sm" }) {
  return (
    <Link
      href={href}
      className={
        "relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4 shadow-sm transition-transform active:scale-[0.97] " +
        gradient +
        " " +
        (size === "lg" ? "h-36" : "h-28")
      }
    >
      <span
        className={
          "relative z-10 font-bold text-white drop-shadow-sm " +
          (size === "lg" ? "text-lg leading-snug" : "text-sm leading-tight")
        }
      >
        {label}
      </span>

      <span className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/15" />
      <span className="pointer-events-none absolute -bottom-1 -right-1 h-14 w-14 rounded-full bg-white/10" />

      <span
        className={
          "relative z-10 ml-auto flex items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm " +
          (size === "lg" ? "h-11 w-11" : "h-9 w-9")
        }
      >
        <Icon className={"text-white " + (size === "lg" ? "h-6 w-6" : "h-5 w-5")} />
      </span>
    </Link>
  )
}

export function QuickActions() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map((action) => (
          <Tile key={action.href} {...action} size="lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SECONDARY_ACTIONS.map((action) => (
          <Tile key={action.href} {...action} size="sm" />
        ))}
      </div>
    </div>
  )
}
