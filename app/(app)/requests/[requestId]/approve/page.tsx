import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ApproveRequestForm } from "./_components/ApproveRequestForm"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function ApproveRequestPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: { patient: { select: { fullName: true } } },
  })

  if (!request) notFound()

  // Only allow approval when in the correct workflow stage
  if (request.workflowStatus !== "ตรวจสอบคลังอุปกรณ์") {
    redirect(`/requests/${requestId}`)
  }

  // Load available items of the requested equipment type
  const availableItems = await db.equipmentItem.findMany({
    where: {
      equipmentType: request.requestedEquipmentType,
      currentStatus: "พร้อมใช้งาน",
      currentLoanRequestId: null,
    },
    orderBy: { assetNumber: "asc" },
  })

  return (
    <div>
      <PageHeader title="อนุมัติคำร้อง" showBack />

      <div className="p-4 space-y-4">
        {/* Request summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สรุปคำร้อง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="เลขที่คำร้อง" value={request.requestNumber} />
            <Row label="ผู้ป่วย" value={request.patient.fullName} />
            <Row label="ประเภทอุปกรณ์" value={request.requestedEquipmentType} />
          </CardContent>
        </Card>

        {/* Available items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              เลือกอุปกรณ์ที่จะจัดสรร ({availableItems.length} รายการพร้อมใช้งาน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableItems.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-4">
                  ไม่มีอุปกรณ์ประเภท &ldquo;{request.requestedEquipmentType}&rdquo; ที่พร้อมใช้งาน
                </p>
                <p className="text-xs text-gray-400">
                  สามารถกด &ldquo;ไม่อนุมัติ&rdquo; เพื่อปฏิเสธคำร้องนี้ได้
                </p>
              </div>
            ) : (
              <ApproveRequestForm
                requestId={requestId}
                availableItems={availableItems.map((item) => ({
                  id: item.id,
                  assetNumber: item.assetNumber,
                  equipmentCode: item.equipmentCode,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  )
}
