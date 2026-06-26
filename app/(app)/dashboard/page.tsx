import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { QuickActions } from "./_components/QuickActions"
import { HeatMapSection } from "./_components/HeatMapSection"
import { RecentRequestsList } from "./_components/RecentRequestsList"

export default async function DashboardPage() {
  const [recentRequests, patientCoords] = await Promise.all([
    db.borrowingRequest.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      include: { patient: { select: { fullName: true } } },
    }),
    db.patient.findMany({
      where: { borrowingRequests: { some: { workflowStatus: { notIn: ["ปิดรายการ", "ไม่อนุมัติ"] } } } },
      select: { latitude: true, longitude: true },
    }),
  ])

  const heatPoints = (patientCoords as Array<{ latitude: unknown; longitude: unknown }>)
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }))

  return (
    <div>
      <PageHeader title="หน้าหลัก" />
      <div className="p-4 space-y-6">
        <QuickActions />
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">คำร้องล่าสุด</h2>
          <RecentRequestsList requests={recentRequests} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">แผนที่ผู้ป่วย</h2>
          <HeatMapSection points={heatPoints} />
        </div>
      </div>
    </div>
  )
}
