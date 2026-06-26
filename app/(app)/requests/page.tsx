import Link from "next/link"
import { db } from "@/lib/db"
import { BORROW_WORKFLOW_STATUSES } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatThaiDateTime } from "@/lib/utils/format-thai-date"
import { Card, CardContent } from "@/components/ui/card"
import { RequestsFilters } from "./_components/RequestsFilters"
import { ClipboardList, Plus } from "lucide-react"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { status } = params

  const requests = await db.borrowingRequest.findMany({
    where: {
      ...(status ? { workflowStatus: status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      patient: { select: { fullName: true } },
    },
  })

  return (
    <div>
      <PageHeader title="คำร้องยืมอุปกรณ์" />

      <div className="p-4">
        <RequestsFilters
          workflowStatuses={[...BORROW_WORKFLOW_STATUSES]}
          currentStatus={status}
        />
      </div>

      <div className="px-4 pb-4 space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่พบคำร้อง</div>
        ) : (
          requests.map((req) => (
            <Link key={req.id} href={`/requests/${req.id}`} className="block">
              <Card>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <StatusBadge status={req.workflowStatus} type="workflow" />
                    <p className="font-semibold text-gray-900 mt-0.5">{req.patient.fullName}</p>
                    <p className="text-sm text-gray-500">{req.requestedEquipmentType}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {req.requestNumber} · {formatThaiDateTime(req.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Link
        href="/patients/new"
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-blue-600 rounded-full shadow-xl flex items-center justify-center text-white"
        aria-label="เพิ่มคำร้องใหม่"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}
