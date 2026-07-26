import { cache } from "react"
import { db } from "@/lib/db"

// Stored workflow/status values may be Thai labels (written by the app) or legacy
// English reference codes (seed data). Match both when bucketing counts.
const ASSESS = ["ประเมินผู้ป่วย", "assessing_patient"]
const AWAITING_APPROVAL = ["ตรวจสอบคลังอุปกรณ์", "inventory_check"]
const AWAITING_DELIVERY = ["อนุมัติ", "เตรียมจัดส่ง", "approved", "preparing_delivery"]
const ACTIVE_LOAN = ["จัดส่งสำเร็จ", "รอคืน", "delivered", "awaiting_return"]

/** How many due-soon loans the dashboard card shows. */
export const DUE_SOON_LIMIT = 5

/**
 * Each dashboard section awaits its own data inside its own Suspense boundary,
 * so the queries fan out in parallel instead of gating one render. `cache()`
 * dedupes the calls that two sections share (the header badge and the due-soon
 * card both need the overdue count) down to a single query per request.
 */

export const getQueueCounts = cache(async () => {
  const [assess, approval, delivery] = await Promise.all([
    db.borrowingRequest.count({ where: { workflowStatus: { in: ASSESS } } }),
    db.borrowingRequest.count({ where: { workflowStatus: { in: AWAITING_APPROVAL } } }),
    db.borrowingRequest.count({ where: { workflowStatus: { in: AWAITING_DELIVERY } } }),
  ])
  return { assess, approval, delivery }
})

/** Soonest-due active loans. Bounded — the card only ever renders a handful. */
export const getDueSoonLoans = cache(async () =>
  db.borrowingRequest.findMany({
    where: { workflowStatus: { in: ACTIVE_LOAN }, dueOrReturnDate: { not: null } },
    orderBy: { dueOrReturnDate: "asc" },
    take: DUE_SOON_LIMIT,
    select: {
      id: true,
      dueOrReturnDate: true,
      requestedEquipmentType: true,
      patient: { select: { fullName: true } },
      assignedEquipmentItem: { select: { equipmentType: true, assetNumber: true } },
    },
  }),
)

/** Overdue total for the header badge — a COUNT, not a full row fetch. */
export const getOverdueCount = cache(async () =>
  db.borrowingRequest.count({
    where: {
      workflowStatus: { in: ACTIVE_LOAN },
      dueOrReturnDate: { lt: new Date() },
    },
  }),
)

export const getInventoryGroups = cache(async () =>
  db.equipmentItem.groupBy({
    by: ["equipmentType", "currentStatus"],
    _count: { id: true },
  }),
)
