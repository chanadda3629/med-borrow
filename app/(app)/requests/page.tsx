import Link from "next/link"
import { ClipboardList } from "lucide-react"
import { db } from "@/lib/db"
import { BORROW_WORKFLOW_STATUSES, workflowTextColor } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { FloatingActionButton } from "@/components/shared/FloatingActionButton"
import { RequestsFilters } from "./_components/RequestsFilters"

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function formatDateTime(d: Date): string {
  const day = d.getDate()
  const mon = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const minute = d.getMinutes().toString().padStart(2, "0")
  const ampm = d.getHours() >= 12 ? "PM" : "AM"
  const hour = (d.getHours() % 12 || 12).toString().padStart(2, "0")
  return `${day} ${mon} ${year}, ${hour}:${minute} ${ampm}`
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

      <div className="p-4 space-y-4 pb-24">
        <RequestsFilters
          workflowStatuses={[...BORROW_WORKFLOW_STATUSES]}
          currentStatus={status}
        />

        {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่พบคำร้อง</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="flex items-start gap-3 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${workflowTextColor(req.workflowStatus)}`}>
                    {req.workflowStatus}
                  </p>
                  <p className="font-semibold text-gray-900 truncate">
                    {req.patient.fullName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {req.requestedEquipmentType}
                  </p>
                  <p className="text-sm text-gray-400">{formatDateTime(req.createdAt)}</p>
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
