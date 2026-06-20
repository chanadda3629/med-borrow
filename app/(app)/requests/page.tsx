import Link from "next/link"
import { db } from "@/lib/db"
import { BORROW_WORKFLOW_STATUSES } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { RequestsFilters } from "./_components/RequestsFilters"

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

      <div className="p-4 space-y-4">
        <RequestsFilters
          workflowStatuses={[...BORROW_WORKFLOW_STATUSES]}
          currentStatus={status}
        />

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่คำร้อง</TableHead>
                  <TableHead>ผู้ป่วย</TableHead>
                  <TableHead>ประเภทอุปกรณ์</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ยื่น</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      ไม่พบคำร้อง
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Link
                          href={`/requests/${req.id}`}
                          className="font-medium text-blue-600 hover:underline text-sm"
                        >
                          {req.requestNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{req.patient.fullName}</TableCell>
                      <TableCell className="text-sm">{req.requestedEquipmentType}</TableCell>
                      <TableCell>
                        <StatusBadge status={req.workflowStatus} type="workflow" />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {req.createdAt.toLocaleDateString("th-TH")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
