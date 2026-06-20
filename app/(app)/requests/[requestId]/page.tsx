import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import {
  getNextBorrowWorkflowStatuses,
  isBorrowWorkflowTerminal,
} from "@/lib/domain/transitions"
import type { BorrowWorkflowStatus } from "@/lib/domain/schemas"
import { aiRecommendationResultSchema } from "@/lib/domain/schemas"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { WorkflowStatusStepper } from "@/components/shared/WorkflowStatusStepper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { WorkflowActions } from "./_components/WorkflowActions"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: true,
      assignedEquipmentItem: true,
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  })

  if (!request) notFound()

  const currentStatus = request.workflowStatus as BorrowWorkflowStatus
  const nextStatuses = getNextBorrowWorkflowStatuses(currentStatus)
  const isTerminal = isBorrowWorkflowTerminal(currentStatus)

  // Parse AI recommendation
  let aiResult: ReturnType<typeof aiRecommendationResultSchema.safeParse> | null = null
  if (request.aiRecommendationResult) {
    aiResult = aiRecommendationResultSchema.safeParse(request.aiRecommendationResult)
  }

  // Determine which next statuses go through special pages vs generic advance
  const approveStatuses = nextStatuses.filter(
    (s) => s === "อนุมัติ" || s === "ไม่อนุมัติ",
  )
  const returnStatuses = nextStatuses.filter((s) => s === "คืนอุปกรณ์")
  const advanceStatuses = nextStatuses.filter(
    (s) => s !== "อนุมัติ" && s !== "ไม่อนุมัติ" && s !== "คืนอุปกรณ์",
  )

  const needsApprovalPage = currentStatus === "ตรวจสอบคลังอุปกรณ์"
  const needsReturnPage = currentStatus === "รอคืน"

  return (
    <div>
      <PageHeader title={`คำร้อง ${request.requestNumber}`} showBack />

      <div className="p-4 space-y-4">
        {/* Workflow stepper */}
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <WorkflowStatusStepper currentStatus={currentStatus} />
          </CardContent>
        </Card>

        {/* Patient info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ข้อมูลผู้ป่วย</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="ชื่อ-สกุล" value={request.patient.fullName} />
            <Row label="เลขบัตรประชาชน" value={request.patient.nationalId} />
            <Row label="เบอร์โทร" value={request.patient.phoneNumber} />
            <Row
              label="ที่อยู่"
              value={`${request.patient.houseNumber} ${request.patient.subdistrict} ${request.patient.district} ${request.patient.province} ${request.patient.postalCode}`}
            />
            <Row label="ประเภทอุปกรณ์ที่ขอ" value={request.requestedEquipmentType} />
          </CardContent>
        </Card>

        {/* AI recommendation */}
        {aiResult?.success && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ผลการแนะนำจาก AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiResult.data.recommendations.map((rec, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      อันดับ {rec.rankingOrder}: {rec.equipmentType}
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {rec.matchingScorePercentage}%
                    </span>
                  </div>
                  {rec.explanation && (
                    <p className="text-xs text-gray-500">{rec.explanation}</p>
                  )}
                </div>
              ))}
              {aiResult.data.staffDecisionEquipmentType && (
                <div className="text-sm text-gray-600 pt-1">
                  <span className="font-medium">เจ้าหน้าที่เลือก: </span>
                  {aiResult.data.staffDecisionEquipmentType}
                </div>
              )}
              {aiResult.data.staffOverrideNote && (
                <p className="text-xs text-gray-500 italic">{aiResult.data.staffOverrideNote}</p>
              )}
              <p className="text-xs text-amber-600 mt-2">
                * AI ให้ข้อมูลเป็นการสนับสนุนการตัดสินใจเท่านั้น เจ้าหน้าที่เป็นผู้อนุมัติขั้นสุดท้าย
              </p>
            </CardContent>
          </Card>
        )}

        {/* Assigned equipment */}
        {request.assignedEquipmentItem && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">อุปกรณ์ที่จัดสรร</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="หมายเลขครุภัณฑ์" value={request.assignedEquipmentItem.assetNumber} />
              <Row label="รหัสอุปกรณ์" value={request.assignedEquipmentItem.equipmentCode} />
              <Row label="ประเภท" value={request.assignedEquipmentItem.equipmentType} />
              <Row
                label="สถานะ"
                value={
                  <StatusBadge
                    status={request.assignedEquipmentItem.currentStatus}
                    type="equipment"
                  />
                }
              />
              <div className="pt-1">
                <Link
                  href={`/inventory/${request.assignedEquipmentItem.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  ดูรายละเอียดอุปกรณ์
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status history */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ประวัติสถานะคำร้อง</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>จากสถานะ</TableHead>
                  <TableHead>ถึงสถานะ</TableHead>
                  <TableHead>วันเวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.statusHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-6">
                      ยังไม่มีประวัติ
                    </TableCell>
                  </TableRow>
                ) : (
                  request.statusHistory.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <StatusBadge status={h.fromStatus} type="workflow" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={h.toStatus} type="workflow" />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {h.changedAt.toLocaleString("th-TH")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Next action buttons */}
        {!isTerminal && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">การดำเนินการถัดไป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Approval stage → link to approve page */}
              {needsApprovalPage && approveStatuses.length > 0 && (
                <Link href={`/requests/${requestId}/approve`} className="block">
                  <Button className="w-full">ตรวจสอบและอนุมัติ / ไม่อนุมัติ</Button>
                </Link>
              )}

              {/* Return stage → link to return page */}
              {needsReturnPage && returnStatuses.length > 0 && (
                <Link href={`/requests/${requestId}/return`} className="block">
                  <Button className="w-full">บันทึกการรับคืนอุปกรณ์</Button>
                </Link>
              )}

              {/* Other transitions → inline confirm */}
              {advanceStatuses.length > 0 && (
                <WorkflowActions requestId={requestId} nextStatuses={advanceStatuses} />
              )}
            </CardContent>
          </Card>
        )}
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
