import { PackageSearch } from "lucide-react"
import { db } from "@/lib/db"
import { LIST_PAGE_SIZE } from "@/lib/domain/constants"
import {
  toThaiEquipmentType,
  toThaiEquipmentStatus,
  toEquipmentTypeCode,
  toEquipmentStatusCode,
} from "@/lib/domain/labels"
import { InventoryTable } from "./InventoryTable"

export interface InventoryListParams {
  type?: string
  status?: string
  q?: string
  sort?: string
}

/**
 * Database half of /inventory, isolated behind Suspense so the header, filter
 * bar and tab bar are on screen before the query resolves.
 */
export async function InventoryList({
  searchParams,
}: {
  searchParams: Promise<InventoryListParams>
}) {
  const { type, status, q, sort } = await searchParams

  // Filter chips carry Thai labels, but rows may be stored as English reference
  // codes (see seed.mjs) — match either form. Rows are ordered by when they were
  // added (createdAt) so the list reflects the order equipment was registered:
  // newest first by default ("ใหม่สุด"), oldest first with sort=asc ("เก่าสุด").
  const fetched = await db.equipmentItem.findMany({
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
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    take: LIST_PAGE_SIZE + 1,
    select: {
      id: true,
      equipmentCode: true,
      assetNumber: true,
      equipmentType: true,
      currentStatus: true,
      condition: true,
      donorName: true,
      receivedDate: true,
      currentLoanRequest: { select: { requestNumber: true } },
    },
  })

  const truncated = fetched.length > LIST_PAGE_SIZE
  const items = truncated ? fetched.slice(0, LIST_PAGE_SIZE) : fetched

  const rows = items.map((item) => {
    const itemStatus = toThaiEquipmentStatus(item.currentStatus)
    // สภาพ (physical condition) reflects the item's health: an item out for
    // maintenance or flagged damaged shows that here, otherwise its stored
    // condition ("ดี"). Colors: ดี green, ซ่อมบำรุง yellow, ชำรุด red.
    const condition =
      itemStatus === "ซ่อมบำรุง" ? "ซ่อมบำรุง" : itemStatus === "ชำรุด" ? "ชำรุด" : item.condition

    return {
      id: item.id,
      equipmentCode: item.equipmentCode,
      assetNumber: item.assetNumber,
      equipmentType: toThaiEquipmentType(item.equipmentType),
      currentStatus: itemStatus,
      condition,
      donorName: item.donorName,
      receivedDate: item.receivedDate.toISOString(),
      currentRequestNumber: item.currentLoanRequest?.requestNumber ?? null,
    }
  })

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <PackageSearch className="h-10 w-10 text-faint" strokeWidth={1.75} />
        <p className="text-sm text-muted">ไม่พบรายการอุปกรณ์</p>
      </div>
    )
  }

  return (
    <>
      <InventoryTable rows={rows} />
      {truncated && (
        <p className="px-1 text-center text-xs text-faint">
          แสดง {LIST_PAGE_SIZE} รายการแรก — ใช้ตัวกรองหรือค้นหาเพื่อดูรายการอื่น
        </p>
      )}
    </>
  )
}
