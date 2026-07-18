import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import {
  getNextBorrowWorkflowStatuses,
  isBorrowWorkflowTerminal,
} from "@/lib/domain/transitions"
import type { BorrowWorkflowStatus } from "@/lib/domain/schemas"
import { aiRecommendationResultSchema, prescribedEquipmentItemSchema } from "@/lib/domain/schemas"
import { z } from "zod"
import { formatThaiDate } from "@/lib/utils/format-thai-date"
import {
  toThaiWorkflowStatus,
  toThaiEquipmentType,
  toThaiEquipmentStatus,
} from "@/lib/domain/labels"
import { formatThaiDateTime } from "@/lib/format"
import { getSession } from "@/lib/auth/get-session"
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
import { StatusOverride } from "./_components/StatusOverride"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: { include: { medicalAssessment: true } },
      assignedEquipmentItem: true,
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  })

  if (!request) notFound()

  // Parse the prescribed-equipment list recorded during assessment (JSON column).
  const assessment = request.patient.medicalAssessment
  const prescribedEquipment = z
    .array(prescribedEquipmentItemSchema)
    .safeParse(assessment?.prescribedEquipment ?? [])

  const session = await getSession()
  const isAdmin = session.user.role === "ADMIN"

  // Normalize legacy/external English codes to the canonical Thai status so the
  // stepper, transition logic, and badges all work (and don't crash on unknowns).
  const currentStatus = toThaiWorkflowStatus(request.workflowStatus) as BorrowWorkflowStatus
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

  const needsAssessPage = currentStatus === "ประเมินผู้ป่วย"
  const needsApprovalPage = currentStatus === "ตรวจสอบคลังอุปกรณ์"
  const needsReturnPage = currentStatus === "รอคืน"

  // The assessment stage advances via the dedicated assess form (which records the
  // clinical finding + equipment), not the generic one-tap advance button.
  const advanceStatuses = nextStatuses.filter(
    (s) =>
      s !== "อนุมัติ" &&
      s !== "ไม่อนุมัติ" &&
      s !== "คืนอุปกรณ์" &&
      !(needsAssessPage && s === "AI แนะนำอุปกรณ์"),
  )

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
            <Row label="ประเภทอุปกรณ์ที่ขอ" value={toThaiEquipmentType(request.requestedEquipmentType)} />
          </CardContent>
        </Card>

        {/* Assessment result (recorded at the "ประเมินผู้ป่วย" stage) */}
        {assessment?.assessmentSummary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ผลการประเมินและสั่งใช้อุปกรณ์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="ผู้ประเมิน" value={assessment.assessorName ?? "-"} />
              {assessment.assessedAt && (
                <Row label="วันที่ประเมิน" value={formatThaiDate(assessment.assessedAt)} />
              )}
              <Row label="ระดับความเร่งด่วน" value={assessment.urgencyLevel} />
              <Row label="ประเมินอาการเบื้องต้น" value={assessment.assessmentSummary} />
              {prescribedEquipment.success && prescribedEquipment.data.length > 0 && (
                <Row
                  label="อุปกรณ์ที่สั่งใช้"
                  value={
                    <ul className="space-y-0.5">
                      {prescribedEquipment.data.map((e) => (
                        <li key={e.equipmentType}>
                          {toThaiEquipmentType(e.equipmentType)} × {e.quantity}
                        </li>
                      ))}
                    </ul>
                  }
                />
              )}
              {assessment.usageRecommendation && (
                <Row label="คำแนะนำการใช้อุปกรณ์" value={assessment.usageRecommendation} />
              )}
              {assessment.equipmentNote && (
                <Row label="หมายเหตุ" value={assessment.equipmentNote} />
              )}
            </CardContent>
          </Card>
        )}

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
              <Row label="ประเภท" value={toThaiEquipmentType(request.assignedEquipmentItem.equipmentType)} />
              <Row label="ผู้บริจาค" value={request.assignedEquipmentItem.donorName ?? "-"} />
              <Row
                label="สถานะ"
                value={
                  <StatusBadge
                    status={toThaiEquipmentStatus(request.assignedEquipmentItem.currentStatus)}
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
                        {h.fromStatus ? (
                          <StatusBadge status={toThaiWorkflowStatus(h.fromStatus)} type="workflow" />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={toThaiWorkflowStatus(h.toStatus)} type="workflow" />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatThaiDateTime(h.changedAt)}
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
              {/* Assessment stage → link to the assessment form */}
              {needsAssessPage && (
                <Link href={`/requests/${requestId}/assess`} className="block">
                  <Button className="w-full">ประเมินผู้ป่วยและสั่งใช้อุปกรณ์</Button>
                </Link>
              )}

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

        {/* Admin status override — set any status, bypassing ordered rules */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">เปลี่ยนสถานะ (แอดมิน)</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusOverride requestId={requestId} currentStatus={currentStatus} />
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
