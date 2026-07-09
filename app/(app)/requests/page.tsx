import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { db } from "@/lib/db"
import { BORROW_WORKFLOW_STATUSES } from "@/lib/domain/constants"
import { toThaiEquipmentType, toThaiWorkflowStatus } from "@/lib/domain/labels"
import { formatThaiDateTime } from "@/lib/format"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { FloatingActionButton } from "@/components/shared/FloatingActionButton"
import { RequestsFilters } from "./_components/RequestsFilters"

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { status, q, sort } = params

  const requests = await db.borrowingRequest.findMany({
    where: {
      ...(status ? { workflowStatus: status } : {}),
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
      patient: { select: { fullName: true } },
    },
  })

  return (
    <div>
      <PageHeader title="คำร้องยืมอุปกรณ์" />

      <div className="p-4 space-y-4 pb-24">
        <RequestsFilters
          workflowStatuses={[...BORROW_WORKFLOW_STATUSES]}
          currentStatus={status}
          currentQ={q}
          currentSort={sort}
        />

        {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่พบคำร้อง</div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate">
                        {req.patient.fullName}
                      </p>
                      <StatusBadge status={toThaiWorkflowStatus(req.workflowStatus)} type="workflow" />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {toThaiEquipmentType(req.requestedEquipmentType)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatThaiDateTime(req.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton href="/requests/new" label="เพิ่มคำร้อง" />
    </div>
  )
}
