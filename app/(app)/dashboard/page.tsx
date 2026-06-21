import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { MetricCards } from "./_components/MetricCards"
import { HeatMapSection } from "./_components/HeatMapSection"
import { RecentRequestsList } from "./_components/RecentRequestsList"

export default async function DashboardPage() {
  const [totalPatients, activeLoans, itemsByStatus, recentRequests, patientCoords] = await Promise.all([
    db.patient.count(),
    db.borrowingRequest.count({ where: { workflowStatus: { notIn: ["ปิดรายการ", "ไม่อนุมัติ"] } } }),
    db.equipmentItem.groupBy({ by: ["currentStatus"], _count: { id: true } }),
    db.borrowingRequest.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      include: { patient: { select: { fullName: true } } },
    }),
    db.patient.findMany({
      where: { borrowingRequests: { some: { workflowStatus: { notIn: ["ปิดรายการ", "ไม่อนุมัติ"] } } } },
      select: { latitude: true, longitude: true },
    }),
  ])

  const statusCounts = Object.fromEntries(
    itemsByStatus.map((g: { currentStatus: string; _count: { id: number } }) => [g.currentStatus, g._count.id])
  )
  const available = statusCounts["พร้อมใช้งาน"] ?? 0
  const onLoan = statusCounts["ถูกยืม"] ?? 0
  const damaged = statusCounts["ชำรุด"] ?? 0

  const heatPoints = (patientCoords as Array<{ latitude: unknown; longitude: unknown }>)
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }))

  return (
    <div>
      <PageHeader title="หน้าหลัก" />
      <div className="p-4 space-y-6">
        <MetricCards totalPatients={totalPatients} activeLoans={activeLoans} available={available} onLoan={onLoan} damaged={damaged} />
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">คำร้องล่าสุด</h2>
          <RecentRequestsList requests={recentRequests} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">แผนที่ความหนาแน่นผู้ป่วย</h2>
          <HeatMapSection points={heatPoints} />
        </div>
      </div>
    </div>
  )
}
