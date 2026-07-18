import Link from "next/link"
import { ClipboardList, FilePlus, ClipboardCheck, Package, PackagePlus, type LucideIcon } from "lucide-react"

interface Action {
  href: string
  title: string
  subtitle: string
  Icon: LucideIcon
  card: string
  text: string
  icon: string
}

const LARGE_ACTIONS: Action[] = [
  {
    href: "/requests",
    title: "คำร้องยืมอุปกรณ์",
    subtitle: "ดูและจัดการคำร้องทั้งหมด",
    Icon: ClipboardList,
    card: "bg-rose-50",
    text: "text-rose-900",
    icon: "text-rose-400",
  },
  {
    href: "/requests/new",
    title: "เพิ่มคำร้อง",
    subtitle: "ลงทะเบียนผู้ป่วยและคำร้องใหม่",
    Icon: FilePlus,
    card: "bg-violet-50",
    text: "text-violet-900",
    icon: "text-violet-400",
  },
]

const SMALL_ACTIONS: Action[] = [
  {
    href: "/requests?status=ประเมินผู้ป่วย",
    title: "ประเมินคำร้อง",
    subtitle: "รอประเมิน",
    Icon: ClipboardCheck,
    card: "bg-sky-50",
    text: "text-sky-900",
    icon: "text-sky-400",
  },
  {
    href: "/inventory",
    title: "คลังอุปกรณ์",
    subtitle: "อุปกรณ์ทั้งหมด",
    Icon: Package,
    card: "bg-amber-50",
    text: "text-amber-900",
    icon: "text-amber-400",
  },
  {
    href: "/inventory/new",
    title: "เพิ่มอุปกรณ์ใหม่",
    subtitle: "เข้าคลัง",
    Icon: PackagePlus,
    card: "bg-emerald-50",
    text: "text-emerald-900",
    icon: "text-emerald-400",
  },
]

function LargeCard({ href, title, subtitle, Icon, card, text, icon }: Action) {
  return (
    <Link
      href={href}
      className={
        "relative flex h-36 flex-col justify-start overflow-hidden rounded-3xl p-4 shadow-sm transition-transform active:scale-[0.97] " +
        card
      }
    >
      <p className={"relative z-10 text-lg font-bold leading-snug " + text}>{title}</p>
      <p className={"relative z-10 mt-1 text-xs " + text + " opacity-70"}>{subtitle}</p>
      <Icon
        className={"pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 " + icon}
        strokeWidth={1.5}
      />
    </Link>
  )
}

function SmallCard({ href, title, subtitle, Icon, card, text, icon }: Action) {
  return (
    <Link
      href={href}
      className={
        "relative flex h-28 flex-col justify-start overflow-hidden rounded-2xl p-3 shadow-sm transition-transform active:scale-[0.97] " +
        card
      }
    >
      <p className={"relative z-10 text-sm font-bold leading-tight " + text}>{title}</p>
      <p className={"relative z-10 mt-0.5 text-[11px] " + text + " opacity-70"}>{subtitle}</p>
      <Icon
        className={"pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 " + icon}
        strokeWidth={1.5}
      />
    </Link>
  )
}

export function QuickActionsGrid() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {LARGE_ACTIONS.map((action) => (
          <LargeCard key={action.href} {...action} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SMALL_ACTIONS.map((action) => (
          <SmallCard key={action.href} {...action} />
        ))}
      </div>
    </div>
  )
}
