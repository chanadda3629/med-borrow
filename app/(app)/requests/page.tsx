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
import { WORKFLOW_DISPLAY_STEPS } from "@/lib/domain/constants"
import { toThaiEquipmentType, toThaiWorkflowStatus } from "@/lib/domain/labels"
import { formatThaiRelativeTime } from "@/lib/format"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge, statusRole, ROLE_ICON_TINT } from "@/components/shared/StatusBadge"
import { FloatingActionButton } from "@/components/shared/FloatingActionButton"
import { RequestsFilters } from "./_components/RequestsFilters"

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>
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

export default async function RequestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { status, q, sort } = params

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

  const requests = await db.borrowingRequest.findMany({
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
    include: {
      patient: {
        select: { fullName: true, reporterName: true, phoneNumber: true },
      },
    },
  })

  // At the intake ("รับคำร้อง") and assessment ("ประเมินผู้ป่วย") stages no equipment
  // type has been chosen yet — the relative has only submitted contact info. Show
  // that instead of the empty "ยังไม่ระบุอุปกรณ์" line on those two queues.
  const CONTACT_DETAIL_STATUSES = ["รับคำร้อง", "ประเมินผู้ป่วย"]

  return (
    <div>
      <PageHeader title="คำร้อง" />

      <div className="space-y-4 p-4 pb-24">
        <RequestsFilters
          workflowStatuses={WORKFLOW_DISPLAY_STEPS.map((s) => s.label)}
          currentStatus={status}
          currentQ={q}
          currentSort={sort}
        />

        {/* Result summary — surfaces how many new requests are in this queue */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-medium text-muted">
            {status ?? "คำร้องทั้งหมด"}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {requests.length} รายการ
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-faint">
              <Inbox className="h-7 w-7" />
            </div>
            <p className="mt-3 font-medium text-muted">ยังไม่มีคำร้องในสถานะนี้</p>
            <p className="mt-1 text-sm text-faint">
              คำร้องใหม่จะปรากฏที่นี่เมื่อมีการรับเข้าระบบ
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {requests.map((req) => {
              const thaiStatus = toThaiWorkflowStatus(req.workflowStatus)
              const showContact = CONTACT_DETAIL_STATUSES.includes(thaiStatus)
              const Icon = STATUS_ICON[thaiStatus] ?? DEFAULT_ICON
              const iconTint = ROLE_ICON_TINT[statusRole(thaiStatus, "workflow")]
              return (
                <Link
                  key={req.id}
                  href={`/requests/${req.id}`}
                  className="group flex items-center gap-3.5 rounded-lg bg-surface p-3.5 shadow-sm transition-all duration-150 ease-apple hover:shadow-md active:scale-[0.99]"
                >
                  <div
                    className={
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full " +
                      iconTint
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[15px] font-semibold text-foreground">
                        {req.patient.reporterName || req.patient.fullName}
                      </p>
                      <StatusBadge status={thaiStatus} type="workflow" />
                    </div>

                    {showContact ? (
                      <div className="mt-1 space-y-0.5">
                        {req.patient.reporterName && (
                          <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                            <User className="h-3.5 w-3.5 shrink-0 text-faint" />
                            ผู้ป่วย: {req.patient.fullName}
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-faint" />
                          {req.patient.phoneNumber}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted">
                        <Package className="h-3.5 w-3.5 shrink-0 text-faint" />
                        {req.requestedEquipmentType
                          ? toThaiEquipmentType(req.requestedEquipmentType)
                          : "ยังไม่ระบุอุปกรณ์"}
                      </p>
                    )}

                    <div className="mt-1.5 flex items-center gap-2 text-xs text-faint">
                      <span className="font-medium text-accent-600">
                        {req.requestNumber}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatThaiRelativeTime(req.createdAt)}</span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-muted" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <FloatingActionButton href="/requests/new" label="เพิ่มคำร้อง" />
    </div>
  )
}
