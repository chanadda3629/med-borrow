import Link from "next/link"
import { Package } from "lucide-react"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { InventoryFilters } from "./_components/InventoryFilters"

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string; q?: string; sort?: string }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { type, status, q, sort } = params

  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const items = await db.equipmentItem.findMany({
    where: {
      ...(type ? { equipmentType: type } : {}),
      ...(status ? { currentStatus: status } : {}),
      ...(q ? { assetNumber: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
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

      <div className="p-4 space-y-4 pb-24">
        <InventoryFilters
          equipmentTypes={[...EQUIPMENT_TYPES]}
          equipmentStatuses={[...EQUIPMENT_STATUSES]}
          currentType={type}
          currentStatus={status}
          currentQ={q}
          currentSort={sort}
        />

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่พบรายการอุปกรณ์</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/inventory/${item.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {item.assetNumber}
                      </p>
                      <StatusBadge status={item.currentStatus} type="equipment" />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {item.equipmentType}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      รับเข้า {item.receivedDate.toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
