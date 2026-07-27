import Link from "next/link"
import {
  ChevronRight,
  Package,
  User,
  Phone,
  Inbox,
  Stethoscope,
  Sparkles,
  PackageSearch,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Truck,
  Clock,
  Undo2,
  Archive,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"
import { db } from "@/lib/db"
import { cn } from "@/lib/utils"
import { LIST_PAGE_SIZE, WORKFLOW_DISPLAY_STEPS } from "@/lib/domain/constants"
import {
  toThaiEquipmentType,
  toThaiEquipmentStatus,
  toThaiWorkflowStatus,
} from "@/lib/domain/labels"
import { formatThaiRelativeTime } from "@/lib/format"
import { StatusBadge, statusRole, ROLE_ICON_TINT } from "@/components/shared/StatusBadge"

export interface RequestsListParams {
  status?: string
  q?: string
  sort?: string
}

// Per-status leading icon. The soft tint is derived from the semantic role
// (StatusBadge §2.4) so the icon circle always matches its status badge.
const STATUS_ICON: Record<string, LucideIcon> = {
  "รับคำร้อง": Inbox,
  "ประเมินผู้ป่วย": Stethoscope,
  "AI แนะนำอุปกรณ์": Sparkles,
  "ตรวจสอบคลังอุปกรณ์": PackageSearch,
  "อนุมัติ": CheckCircle2,
  "ไม่อนุมัติ": XCircle,
  "เตรียมจัดส่ง": PackageCheck,
  "จัดส่งสำเร็จ": Truck,
  "รอคืน": Clock,
  "คืนอุปกรณ์": Undo2,
  "ปิดรายการ": Archive,
}

const DEFAULT_ICON = ClipboardList

// At the intake ("รับคำร้อง") and assessment ("ประเมินผู้ป่วย") stages no equipment
// type has been chosen yet — the relative has only submitted contact info. Show
// that instead of the empty "ยังไม่ระบุอุปกรณ์" line on those two queues.
const CONTACT_DETAIL_STATUSES = ["รับคำร้อง", "ประเมินผู้ป่วย"]

// A single borrowing request within a grouped card.
interface RequestItem {
  id: string
  requestNumber: string
  requestedEquipmentType: string
  createdAt: Date
}

// One card = all requests of the same patient that share the same workflow status.
// Grouping only ever collapses rows that would otherwise repeat the patient name;
// different statuses stay in their own cards (and their own filter chips).
interface RequestGroup {
  key: string
  thaiStatus: string
  patient: { fullName: string; reporterName: string | null; phoneNumber: string }
  items: RequestItem[]
}

/**
 * The only part of /requests that touches the database. It is rendered inside a
 * Suspense boundary so the header, filters and tab bar paint immediately and the
 * rows stream in when the query resolves.
 */
export async function RequestsList({
  searchParams,
}: {
  searchParams: Promise<RequestsListParams>
}) {
  const { status, q, sort } = await searchParams

  // A chip value is a display-step label (e.g. "อนุมัติ / ไม่อนุมัติ" covers both
  // อนุมัติ and ไม่อนุมัติ). Fall back to treating an unknown value as a raw status
  // so direct links like /requests?status=อนุมัติ keep working.
  const statusGroup = status
    ? WORKFLOW_DISPLAY_STEPS.find((s) => s.label === status)
    : undefined
  const statusFilter = statusGroup
    ? { workflowStatus: { in: statusGroup.statuses } }
    : status
      ? { workflowStatus: status }
      : {}

  // Fetch one past the page size: a full extra row means the list is truncated,
  // which we can show without paying for a second COUNT round-trip.
  //
  // `availableTypes` is resolved in parallel so a request's card can flag whether
  // its equipment type has a ready-to-lend item in stock (มีในคลัง / ของหมด).
  const [rows, availableTypes] = await Promise.all([
    db.borrowingRequest.findMany({
      where: {
        ...statusFilter,
        ...(q
          ? {
              OR: [
                { patient: { fullName: { contains: q, mode: "insensitive" } } },
                { requestNumber: { contains: q, mode: "insensitive" } },
                { requestedEquipmentType: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      take: LIST_PAGE_SIZE + 1,
      select: {
        id: true,
        requestNumber: true,
        workflowStatus: true,
        requestedEquipmentType: true,
        createdAt: true,
        patientId: true,
        patient: {
          select: { fullName: true, reporterName: true, phoneNumber: true },
        },
      },
    }),
    getAvailableEquipmentTypes(),
  ])

  const truncated = rows.length > LIST_PAGE_SIZE
  const requests = truncated ? rows.slice(0, LIST_PAGE_SIZE) : rows

  if (requests.length === 0) {
    return (
      <>
        <ResultSummary status={status} count={0} truncated={false} />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-faint">
            <Inbox className="h-7 w-7" />
          </div>
          <p className="mt-3 font-medium text-muted">ยังไม่มีคำร้องในสถานะนี้</p>
          <p className="mt-1 text-sm text-faint">
            คำร้องใหม่จะปรากฏที่นี่เมื่อมีการรับเข้าระบบ
          </p>
        </div>
      </>
    )
  }

  // Collapse consecutive rows into one card per (patient, status). Rows arrive in
  // createdAt order, so a group's first item is also its most recent one and the
  // insertion order of `groups` follows that same ordering.
  const byKey = new Map<string, RequestGroup>()
  const groups: RequestGroup[] = []
  for (const req of requests) {
    const thaiStatus = toThaiWorkflowStatus(req.workflowStatus)
    const key = `${req.patientId}::${thaiStatus}`
    let group = byKey.get(key)
    if (!group) {
      group = { key, thaiStatus, patient: req.patient, items: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.items.push({
      id: req.id,
      requestNumber: req.requestNumber,
      requestedEquipmentType: req.requestedEquipmentType,
      createdAt: req.createdAt,
    })
  }

  return (
    <>
      <ResultSummary status={status} count={requests.length} truncated={truncated} />

      <div className="space-y-2.5">
        {groups.map((group) => (
          <RequestCard key={group.key} group={group} availableTypes={availableTypes} />
        ))}
      </div>

      {truncated && (
        <p className="px-1 pt-1 text-center text-xs text-faint">
          แสดง {LIST_PAGE_SIZE} รายการล่าสุด — ใช้ตัวกรองหรือค้นหาเพื่อดูรายการอื่น
        </p>
      )}
    </>
  )
}

/**
 * One request-list card. A group with a single request keeps the original single
 * row layout untouched (only gaining a stock badge on its equipment line); a group
 * with several requests shows the patient/status header once and lists each request
 * beneath it so the patient name no longer repeats down the list.
 */
function RequestCard({
  group,
  availableTypes,
}: {
  group: RequestGroup
  availableTypes: Set<string>
}) {
  const { thaiStatus } = group
  const showContact = CONTACT_DETAIL_STATUSES.includes(thaiStatus)
  const Icon = STATUS_ICON[thaiStatus] ?? DEFAULT_ICON
  const iconTint = ROLE_ICON_TINT[statusRole(thaiStatus, "workflow")]

  const iconCircle = (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
        iconTint,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  )

  // Single request → keep the original clickable-row card verbatim.
  if (group.items.length === 1) {
    const item = group.items[0]
    return (
      <Link
        href={`/requests/${item.id}`}
        className="group flex items-center gap-3.5 rounded-lg bg-surface p-3.5 shadow-sm transition-all duration-150 ease-apple hover:shadow-md active:scale-[0.99]"
      >
        {iconCircle}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[15px] font-semibold text-foreground">
              {group.patient.reporterName || group.patient.fullName}
            </p>
            <StatusBadge status={thaiStatus} type="workflow" />
          </div>

          {showContact ? (
            <ContactLines patient={group.patient} />
          ) : (
            <EquipmentLine
              type={item.requestedEquipmentType}
              availableTypes={availableTypes}
            />
          )}

          <div className="mt-1.5 flex items-center gap-2 text-xs text-faint">
            <span className="font-medium text-accent-600">{item.requestNumber}</span>
            <span aria-hidden>·</span>
            <span>{formatThaiRelativeTime(item.createdAt)}</span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-muted" />
      </Link>
    )
  }

  // Multiple requests of the same patient + status → one card, listed inside.
  return (
    <div className="flex items-start gap-3.5 rounded-lg bg-surface p-3.5 shadow-sm">
      {iconCircle}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {group.patient.reporterName || group.patient.fullName}
          </p>
          <StatusBadge status={thaiStatus} type="workflow" />
        </div>

        {showContact && <ContactLines patient={group.patient} />}

        <ul className="mt-2 divide-y divide-hairline">
          {group.items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/requests/${item.id}`}
                className="group -mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-2 transition-colors hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  {showContact ? null : (
                    <EquipmentLine
                      type={item.requestedEquipmentType}
                      availableTypes={availableTypes}
                      className="mt-0"
                    />
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs text-faint",
                      showContact ? "" : "mt-1",
                    )}
                  >
                    <span className="font-medium text-accent-600">
                      {item.requestNumber}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatThaiRelativeTime(item.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Patient contact block, shown at the intake / assessment stages. */
function ContactLines({
  patient,
}: {
  patient: { fullName: string; reporterName: string | null; phoneNumber: string }
}) {
  return (
    <div className="mt-1 space-y-0.5">
      {patient.reporterName && (
        <p className="flex items-center gap-1.5 truncate text-sm text-muted">
          <User className="h-3.5 w-3.5 shrink-0 text-faint" />
          ผู้ป่วย: {patient.fullName}
        </p>
      )}
      <p className="flex items-center gap-1.5 truncate text-sm text-muted">
        <Phone className="h-3.5 w-3.5 shrink-0 text-faint" />
        {patient.phoneNumber}
      </p>
    </div>
  )
}

/** Equipment name line with an at-a-glance stock badge, matching the original row style. */
function EquipmentLine({
  type,
  availableTypes,
  className,
}: {
  type: string
  availableTypes: Set<string>
  className?: string
}) {
  if (!type) {
    return (
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 truncate text-sm text-muted",
          className,
        )}
      >
        <Package className="h-3.5 w-3.5 shrink-0 text-faint" />
        ยังไม่ระบุอุปกรณ์
      </p>
    )
  }

  const thaiType = toThaiEquipmentType(type)
  const inStock = availableTypes.has(thaiType)
  return (
    <div className={cn("mt-1 flex items-center gap-1.5", className)}>
      <Package className="h-3.5 w-3.5 shrink-0 text-faint" />
      <span className="truncate text-sm text-muted">{thaiType}</span>
      <StockBadge inStock={inStock} />
    </div>
  )
}

/** Short in-stock / out-of-stock pill. Reuses the app's semantic soft-role colors. */
function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        inStock ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", inStock ? "bg-success" : "bg-danger")}
      />
      {inStock ? "มีในคลัง" : "ของหมด"}
    </span>
  )
}

/**
 * Set of (Thai-normalized) equipment types that have at least one ready-to-lend
 * item — status "พร้อมใช้งาน" and not already bound to a loan, matching the
 * allocation rule on the approval page. The inventory is small, so a single
 * lightweight scan is cheaper than a per-type availability query.
 */
async function getAvailableEquipmentTypes(): Promise<Set<string>> {
  const items = await db.equipmentItem.findMany({
    where: { currentLoanRequestId: null },
    select: { equipmentType: true, currentStatus: true },
  })
  const types = new Set<string>()
  for (const item of items) {
    if (toThaiEquipmentStatus(item.currentStatus) === "พร้อมใช้งาน") {
      types.add(toThaiEquipmentType(item.equipmentType))
    }
  }
  return types
}

/** Result count line. Lives with the list because the number is query output. */
function ResultSummary({
  status,
  count,
  truncated,
}: {
  status?: string
  count: number
  truncated: boolean
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <p className="text-sm font-medium text-muted">{status ?? "คำร้องทั้งหมด"}</p>
      <p className="text-sm font-semibold text-foreground">
        {count}
        {truncated ? "+" : ""} รายการ
      </p>
    </div>
  )
}
