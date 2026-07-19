import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { toThaiEquipmentType, toThaiWorkflowStatus } from "@/lib/domain/labels"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PrepareDeliveryForm } from "./_components/PrepareDeliveryForm"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function PrepareDeliveryPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: { select: { fullName: true } },
      assignedEquipmentItem: {
        select: { assetNumber: true, equipmentCode: true, equipmentType: true },
      },
    },
  })

  if (!request) notFound()

  // เตรียมจัดส่ง only follows อนุมัติ. Normalize legacy English-coded statuses.
  if (toThaiWorkflowStatus(request.workflowStatus) !== "อนุมัติ") {
    redirect(`/requests/${requestId}`)
  }

  return (
    <div>
      <PageHeader title="เตรียมจัดส่ง" showBack />

      <div className="p-4 space-y-4">
        {/* Equipment to deliver (assigned at approval) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">อุปกรณ์ที่ต้องการจัดส่ง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="เลขที่คำร้อง" value={request.requestNumber} />
            <Row label="ผู้ป่วย" value={request.patient.fullName} />
            {request.assignedEquipmentItem ? (
              <>
                <Row
                  label="ประเภทอุปกรณ์"
                  value={toThaiEquipmentType(request.assignedEquipmentItem.equipmentType)}
                />
                <Row label="หมายเลขครุภัณฑ์" value={request.assignedEquipmentItem.assetNumber} />
                <Row label="รหัสอุปกรณ์" value={request.assignedEquipmentItem.equipmentCode} />
              </>
            ) : (
              <p className="text-sm text-gray-400">ยังไม่มีอุปกรณ์ที่จัดสรร</p>
            )}
          </CardContent>
        </Card>

        {/* Delivery plan form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ข้อมูลการจัดส่ง</CardTitle>
          </CardHeader>
          <CardContent>
            <PrepareDeliveryForm requestId={requestId} />
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
