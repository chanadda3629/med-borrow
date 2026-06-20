import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"

export default async function ReportsPage() {
  const [notifications, inventoryByType] = await Promise.all([
    db.notificationHistory.findMany({ orderBy: { triggeredAt: "desc" }, take: 20 }),
    db.equipmentItem.groupBy({ by: ["equipmentType", "currentStatus"], _count: { id: true } }),
  ])

  const typeStats = EQUIPMENT_TYPES.map((type) => {
    const rows = inventoryByType.filter((r) => r.equipmentType === type)
    const available = rows.find((r) => r.currentStatus === "พร้อมใช้งาน")?._count.id ?? 0
    const onLoan = rows.find((r) => r.currentStatus === "ถูกยืม")?._count.id ?? 0
    const damaged = rows.find((r) => r.currentStatus === "ชำรุด")?._count.id ?? 0
    const total = rows.reduce((s, r) => s + r._count.id, 0)
    return { type, available, onLoan, damaged, total }
  }).filter((t) => t.total > 0)

  return (
    <div>
      <PageHeader title="รายงาน" />
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader><CardTitle>สรุปคลังอุปกรณ์ตามประเภท</CardTitle></CardHeader>
          <CardContent className="p-0">
            {typeStats.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">ยังไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-gray-500">ประเภท</th>
                  <th className="text-right px-4 py-2 text-green-600">พร้อม</th>
                  <th className="text-right px-4 py-2 text-blue-600">ยืม</th>
                  <th className="text-right px-4 py-2 text-red-600">ชำรุด</th>
                </tr></thead>
                <tbody>
                  {typeStats.map((t) => (
                    <tr key={t.type} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium">{t.type}</td>
                      <td className="px-4 py-3 text-right text-green-700">{t.available}</td>
                      <td className="px-4 py-3 text-right text-blue-700">{t.onLoan}</td>
                      <td className="px-4 py-3 text-right text-red-700">{t.damaged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ประวัติการแจ้งเตือน LINE</CardTitle></CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">ยังไม่มีประวัติ</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-gray-700 flex-1 truncate">{n.message}</p>
                      <span className={n.deliveryStatus === "sent" ? "text-xs text-green-600" : "text-xs text-red-500"}>
                        {n.deliveryStatus === "sent" ? "ส่งสำเร็จ" : "ล้มเหลว"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{n.triggeredAt.toLocaleDateString("th-TH")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
