import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

interface PageProps {
  params: Promise<{ itemId: string }>
}

export default async function InventoryItemPage({ params }: PageProps) {
  const { itemId } = await params

  const item = await db.equipmentItem.findUnique({
    where: { id: itemId },
    include: {
      statusHistory: { orderBy: { changedAt: "desc" } },
      returnHistory: { orderBy: { returnDate: "desc" } },
    },
  })

  if (!item) notFound()

  return (
    <div>
      <PageHeader title={`อุปกรณ์ ${item.assetNumber}`} showBack />

      <div className="p-4 space-y-4">
        {/* Item details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ข้อมูลอุปกรณ์</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="รหัสอุปกรณ์" value={item.equipmentCode} />
            <Row label="หมายเลขครุภัณฑ์" value={item.assetNumber} />
            <Row label="ประเภทอุปกรณ์" value={item.equipmentType} />
            <Row
              label="สถานะปัจจุบัน"
              value={<StatusBadge status={item.currentStatus} type="equipment" />}
            />
            <Row
              label="วันที่รับเข้าคลัง"
              value={item.receivedDate.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <Row
              label="วันที่บันทึก"
              value={item.createdAt.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            {item.currentLoanRequestId && (
              <Row label="คำร้องปัจจุบัน" value={item.currentLoanRequestId} />
            )}
          </CardContent>
        </Card>

        {/* Status history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ประวัติสถานะ</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>จากสถานะ</TableHead>
                  <TableHead>ถึงสถานะ</TableHead>
                  <TableHead>วันเวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.statusHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-6">
                      ยังไม่มีประวัติสถานะ
                    </TableCell>
                  </TableRow>
                ) : (
                  item.statusHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <StatusBadge status={h.fromStatus} type="equipment" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={h.toStatus} type="equipment" />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {h.changedAt.toLocaleString("th-TH")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Return history */}
        {item.returnHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ประวัติการรับคืน</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่รับคืน</TableHead>
                    <TableHead>สภาพ</TableHead>
                    <TableHead>ผู้รับคืน</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.returnHistory.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        {r.returnDate.toLocaleDateString("th-TH")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${
                            r.condition === "ใช้งานได้"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {r.condition}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{r.receivingStaffName}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {r.damageNote ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  )
}
