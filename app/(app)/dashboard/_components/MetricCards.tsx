import { Card, CardContent } from "@/components/ui/card"
import { Users, Package, ArrowUpFromLine, AlertTriangle, Activity } from "lucide-react"

interface MetricCardsProps {
  totalPatients: number
  activeLoans: number
  available: number
  onLoan: number
  damaged: number
}

export function MetricCards({ totalPatients, activeLoans, available, onLoan, damaged }: MetricCardsProps) {
  const metrics = [
    { label: "ผู้ป่วยทั้งหมด", value: totalPatients, Icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "คำร้องที่ใช้งาน", value: activeLoans, Icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "พร้อมใช้งาน", value: available, Icon: Package, color: "text-green-600", bg: "bg-green-50" },
    { label: "กำลังถูกยืม", value: onLoan, Icon: ArrowUpFromLine, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "ชำรุด", value: damaged, Icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(({ label, value, Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <div className={bg + " w-10 h-10 rounded-xl flex items-center justify-center mb-3"}>
              <Icon className={"w-5 h-5 " + color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
