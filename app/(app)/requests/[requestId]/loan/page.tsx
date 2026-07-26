import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { toThaiEquipmentType, toThaiWorkflowStatus } from "@/lib/domain/labels"
import { formatThaiDate } from "@/lib/utils/format-thai-date"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StartReturnWaitingForm } from "./_components/StartReturnWaitingForm"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function LoanPage({ params }: PageProps) {
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

  // รอคืน only follows จัดส่งสำเร็จ. Normalize legacy English-coded statuses.
  if (toThaiWorkflowStatus(request.workflowStatus) !== "จัดส่งสำเร็จ") {
    redirect(`/requests/${requestId}`)
  }

  return (
    <div>
      <PageHeader title="เริ่มการยืม / รอคืน" showBack />

      <div className="p-4 space-y-4">
        {/* Item currently on loan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">รายการที่กำลังยืม</CardTitle>
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
              </>
            ) : (
              <p className="text-sm text-faint">ยังไม่มีอุปกรณ์ที่จัดสรร</p>
            )}
            {request.dueOrReturnDate && (
              <Row label="กำหนดคืนอุปกรณ์" value={formatThaiDate(request.dueOrReturnDate)} />
            )}
          </CardContent>
        </Card>

        {/* Loan details form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">รายละเอียดการยืม</CardTitle>
          </CardHeader>
          <CardContent>
            <StartReturnWaitingForm
              requestId={requestId}
              defaultDelivererName={request.delivererName ?? undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-muted w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground flex-1">{value}</span>
    </div>
  )
}
