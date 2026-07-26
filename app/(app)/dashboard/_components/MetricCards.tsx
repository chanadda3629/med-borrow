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
    { label: "ผู้ป่วยทั้งหมด", value: totalPatients, Icon: Users, color: "text-accent-600", bg: "bg-accent-50" },
    { label: "คำร้องที่ใช้งาน", value: activeLoans, Icon: Activity, color: "text-info", bg: "bg-info-soft" },
    { label: "พร้อมใช้งาน", value: available, Icon: Package, color: "text-success", bg: "bg-success-soft" },
    { label: "กำลังถูกยืม", value: onLoan, Icon: ArrowUpFromLine, color: "text-warning", bg: "bg-warning-soft" },
    { label: "ชำรุด", value: damaged, Icon: AlertTriangle, color: "text-danger", bg: "bg-danger-soft" },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(({ label, value, Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <div className={bg + " w-10 h-10 rounded-md flex items-center justify-center mb-3"}>
              <Icon className={"w-5 h-5 " + color} strokeWidth={1.75} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
