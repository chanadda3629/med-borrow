import Link from "next/link"
import { PackageSearch } from "lucide-react"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "@/lib/domain/constants"
import {
  toThaiEquipmentType,
  toThaiEquipmentStatus,
  toEquipmentTypeCode,
  toEquipmentStatusCode,
} from "@/lib/domain/labels"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { InventoryFilters } from "./_components/InventoryFilters"
import { InventoryTable } from "./_components/InventoryTable"

interface PageProps {
  searchParams: Promise<{ type?: string; status?: string; q?: string; sort?: string }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { type, status, q, sort } = params

  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  // Filter chips carry Thai labels, but rows may be stored as English reference
  // codes (see seed.mjs) — match either form. Codes are ordered by equipmentCode
  // so the list reads like the request records (BED-2023-001, BED-2023-002, …).
  const items = await db.equipmentItem.findMany({
    where: {
      ...(type ? { equipmentType: { in: [type, toEquipmentTypeCode(type)] } } : {}),
      ...(status ? { currentStatus: { in: [status, toEquipmentStatusCode(status)] } } : {}),
      ...(q
        ? {
            OR: [
              { equipmentCode: { contains: q, mode: "insensitive" } },
              { assetNumber: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { equipmentCode: sort === "desc" ? "desc" : "asc" },
    include: { currentLoanRequest: { select: { requestNumber: true } } },
  })

  const rows = items.map((item) => {
    const status = toThaiEquipmentStatus(item.currentStatus)
    // สภาพ (physical condition) reflects the item's health: an item out for
    // maintenance or flagged damaged shows that here, otherwise its stored
    // condition ("ดี"). Colors: ดี green, ซ่อมบำรุง yellow, ชำรุด red.
    const condition =
      status === "ซ่อมบำรุง" ? "ซ่อมบำรุง" : status === "ชำรุด" ? "ชำรุด" : item.condition

    return {
      id: item.id,
      equipmentCode: item.equipmentCode,
      assetNumber: item.assetNumber,
      equipmentType: toThaiEquipmentType(item.equipmentType),
      currentStatus: status,
      condition,
      donorName: item.donorName,
      receivedDate: item.receivedDate.toISOString(),
      currentRequestNumber: item.currentLoanRequest?.requestNumber ?? null,
    }
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

      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 pb-24">
        <InventoryFilters
          equipmentTypes={[...EQUIPMENT_TYPES]}
          equipmentStatuses={[...EQUIPMENT_STATUSES]}
          currentType={type}
          currentStatus={status}
          currentQ={q}
          currentSort={sort}
        />

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PackageSearch className="h-10 w-10 text-faint" strokeWidth={1.75} />
            <p className="text-sm text-muted">ไม่พบรายการอุปกรณ์</p>
          </div>
        ) : (
          <InventoryTable rows={rows} />
        )}
      </div>
    </div>
  )
}
