import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { InventoryFilters } from "./_components/InventoryFilters"

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { type, status, q } = params

  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const [items, statusGroups] = await Promise.all([
    db.equipmentItem.findMany({
      where: {
        ...(type ? { equipmentType: type } : {}),
        ...(status ? { currentStatus: status } : {}),
        ...(q ? { assetNumber: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
    }),
    db.equipmentItem.groupBy({
      by: ["currentStatus"],
      _count: { id: true },
    }),
  ])

  const counts = Object.fromEntries(statusGroups.map((g) => [g.currentStatus, g._count.id]))
  const available = counts["พร้อมใช้งาน"] ?? 0
  const onLoan = counts["ถูกยืม"] ?? 0
  const damaged = counts["ชำรุด"] ?? 0

  return (
    <div>
      <PageHeader
        title="คลังอุปกรณ์"
        actions={
          isAdmin ? (
            <Link href="/inventory/new">
              <Button size="sm">+ เพิ่มอุปกรณ์</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="p-4 space-y-4">
        {/* Summary counts */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{available}</div>
              <div className="text-xs text-gray-500 mt-1">พร้อมใช้งาน</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{onLoan}</div>
              <div className="text-xs text-gray-500 mt-1">ถูกยืม</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{damaged}</div>
              <div className="text-xs text-gray-500 mt-1">ชำรุด</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <InventoryFilters
          equipmentTypes={[...EQUIPMENT_TYPES]}
          equipmentStatuses={[...EQUIPMENT_STATUSES]}
          currentType={type}
          currentStatus={status}
          currentQ={q}
        />

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>หมายเลขครุภัณฑ์</TableHead>
                  <TableHead>ประเภทอุปกรณ์</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่รับ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                      ไม่พบรายการอุปกรณ์
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <Link href={`/inventory/${item.id}`} className="font-medium text-blue-600 hover:underline">
                          {item.assetNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{item.equipmentType}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.currentStatus} type="equipment" />
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {item.receivedDate.toLocaleDateString("th-TH")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
