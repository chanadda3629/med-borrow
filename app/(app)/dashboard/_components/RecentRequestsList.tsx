import Link from "next/link"
import { StatusBadge } from "@/components/shared/StatusBadge"

interface Request {
  id: string
  requestNumber: string
  workflowStatus: string
  requestedEquipmentType: string
  patient: { fullName: string }
}

export function RecentRequestsList({ requests }: { requests: Request[] }) {
  if (requests.length === 0) return <p className="text-sm text-gray-400">ยังไม่มีคำร้อง</p>
  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <Link key={r.id} href={"/requests/" + r.id}
          className="block bg-white rounded-xl border border-gray-200 p-3 hover:border-blue-300">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{r.patient.fullName}</p>
              <p className="text-xs text-gray-500">{r.requestNumber} · {r.requestedEquipmentType}</p>
            </div>
            <StatusBadge status={r.workflowStatus} type="workflow" />
          </div>
        </Link>
      ))}
    </div>
  )
}
