import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InventoryFilters } from "./_components/InventoryFilters"
import { Package, Plus } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { type, status, q } = params

  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const items = await db.equipmentItem.findMany({
    where: {
      ...(type ? { equipmentType: type } : {}),
      ...(status ? { currentStatus: status } : {}),
      ...(q ? { assetNumber: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  })

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

      <div className="p-4">
        <InventoryFilters
          equipmentTypes={[...EQUIPMENT_TYPES]}
          equipmentStatuses={[...EQUIPMENT_STATUSES]}
          currentType={type}
          currentStatus={status}
          currentQ={q}
        />
      </div>

      <div className="px-4 pb-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่พบรายการอุปกรณ์</div>
        ) : (
          items.map((item) => (
            <Link key={item.id} href={`/inventory/${item.id}`} className="block">
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <StatusBadge status={item.currentStatus} type="equipment" />
                    <p className="font-semibold text-gray-900 mt-0.5">{item.assetNumber}</p>
                    <p className="text-sm text-gray-500">{item.equipmentType}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      รับเข้า {item.receivedDate.toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {isAdmin && (
        <Link
          href="/inventory/new"
          className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-blue-600 rounded-full shadow-xl flex items-center justify-center text-white"
          aria-label="เพิ่มอุปกรณ์ใหม่"
        >
          <Plus className="w-7 h-7" />
        </Link>
      )}
    </div>
  )
}
