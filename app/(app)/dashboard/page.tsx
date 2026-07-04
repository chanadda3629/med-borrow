import Link from "next/link"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { QuickActionsGrid } from "./_components/QuickActionsGrid"
import { HeatMapSection } from "./_components/HeatMapSection"
import { RecentRequestsList } from "./_components/RecentRequestsList"

export default async function DashboardPage() {
  const [recentRequests, patientCoords] = await Promise.all([
    db.borrowingRequest.findMany({
      orderBy: { createdAt: "desc" }, take: 3,
      include: { patient: { select: { fullName: true } } },
    }),
    db.patient.findMany({
      where: { borrowingRequests: { some: { workflowStatus: { notIn: ["ปิดรายการ", "ไม่อนุมัติ"] } } } },
      select: { latitude: true, longitude: true },
    }),
  ])

  const heatPoints = patientCoords
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }))

  return (
    <div>
      <PageHeader title="หน้าหลัก" />
      <div className="p-4 space-y-6">
        <QuickActionsGrid />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">คำร้องล่าสุด</h2>
            <Link href="/requests" className="text-sm text-blue-600 hover:text-blue-700">ดูทั้งหมด →</Link>
          </div>
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
