import Link from "next/link"
import { ClipboardList, Package, FilePlus, PackagePlus, type LucideIcon } from "lucide-react"

interface Action {
  href: string
  title: string
  subtitle: string
  Icon: LucideIcon
  color: string
  bg: string
  primary?: boolean
}

const ACTIONS: Action[] = [
  { href: "/requests", title: "คำร้อง", subtitle: "ดูและจัดการคำร้อง", Icon: ClipboardList, color: "text-white", bg: "bg-blue-600", primary: true },
  { href: "/inventory", title: "คลังอุปกรณ์", subtitle: "อุปกรณ์ทั้งหมด", Icon: Package, color: "text-white", bg: "bg-teal-600", primary: true },
  { href: "/requests/new", title: "เพิ่มคำร้อง", subtitle: "ลงทะเบียนผู้ป่วยใหม่", Icon: FilePlus, color: "text-indigo-600", bg: "bg-indigo-50" },
  { href: "/inventory/new", title: "เพิ่มอุปกรณ์", subtitle: "เพิ่มอุปกรณ์เข้าคลัง", Icon: PackagePlus, color: "text-amber-600", bg: "bg-amber-50" },
]

export function QuickActionsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map(({ href, title, subtitle, Icon, color, bg, primary }) => (
        <Link
          key={href}
          href={href}
          className={
            "flex flex-col gap-3 rounded-xl border p-4 transition-colors " +
            (primary
              ? "bg-white border-gray-200 hover:border-blue-400 shadow-sm"
              : "bg-white border-gray-200 hover:border-blue-300")
          }
        >
          <div className={bg + " w-10 h-10 rounded-xl flex items-center justify-center"}>
            <Icon className={"w-5 h-5 " + color} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
