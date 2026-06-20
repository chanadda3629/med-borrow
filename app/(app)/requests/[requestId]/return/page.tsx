import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReturnForm } from "./_components/ReturnForm"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function ReturnPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: { select: { fullName: true } },
      assignedEquipmentItem: { select: { assetNumber: true, equipmentType: true } },
    },
  })

  if (!request) notFound()

  if (request.workflowStatus !== "รอคืน") {
    redirect(`/requests/${requestId}`)
  }

  return (
    <div>
      <PageHeader title="บันทึกการรับคืนอุปกรณ์" showBack />

      <div className="p-4 space-y-4">
        {/* Request summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ข้อมูลคำร้อง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="เลขที่คำร้อง" value={request.requestNumber} />
            <Row label="ผู้ป่วย" value={request.patient.fullName} />
            {request.assignedEquipmentItem && (
              <>
                <Row
                  label="หมายเลขครุภัณฑ์"
                  value={request.assignedEquipmentItem.assetNumber}
                />
                <Row
                  label="ประเภทอุปกรณ์"
                  value={request.assignedEquipmentItem.equipmentType}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Return form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">แบบฟอร์มรับคืนอุปกรณ์</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnForm requestId={requestId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  )
}
