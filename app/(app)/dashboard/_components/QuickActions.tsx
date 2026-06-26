import Link from "next/link"
import { UserPlus, ClipboardList, Package, PackagePlus } from "lucide-react"

const ACTIONS = [
  { href: "/patients/new", label: "ลงทะเบียนผู้ป่วย", Icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/requests", label: "คำร้องทั้งหมด", Icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" },
  { href: "/inventory", label: "คลังอุปกรณ์", Icon: Package, color: "text-green-600", bg: "bg-green-50" },
  { href: "/inventory/new", label: "เพิ่มอุปกรณ์", Icon: PackagePlus, color: "text-amber-600", bg: "bg-amber-50" },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ACTIONS.map(({ href, label, Icon, color, bg }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 text-center transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <span className={bg + " w-11 h-11 rounded-xl flex items-center justify-center"}>
            <Icon className={"w-5 h-5 " + color} />
          </span>
          <span className="text-xs font-medium leading-tight text-gray-700">{label}</span>
        </Link>
      ))}
    </div>
  )
}
