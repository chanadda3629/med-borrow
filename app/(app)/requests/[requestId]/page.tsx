import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { isBorrowWorkflowTerminal } from "@/lib/domain/transitions"
import type { BorrowWorkflowStatus } from "@/lib/domain/schemas"
import { aiRecommendationResultSchema, prescribedEquipmentItemSchema } from "@/lib/domain/schemas"
import { z } from "zod"
import { formatThaiDate } from "@/lib/utils/format-thai-date"
import {
  toThaiWorkflowStatus,
  toThaiEquipmentType,
  toThaiEquipmentStatus,
} from "@/lib/domain/labels"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { WorkflowStatusStepper } from "@/components/shared/WorkflowStatusStepper"
import { DeliveryTracker } from "@/components/shared/DeliveryTracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { WorkflowActions } from "./_components/WorkflowActions"
import { NextActionNav } from "./_components/NextActionNav"

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
      returnRecord: true,
    },
  })

  if (!request) notFound()

  // Parse the prescribed-equipment list recorded during assessment (JSON column).
  const assessment = request.patient.medicalAssessment
  const prescribedEquipment = z
    .array(prescribedEquipmentItemSchema)
    .safeParse(assessment?.prescribedEquipment ?? [])

  // Normalize legacy/external English codes to the canonical Thai status so the
  // stepper, transition logic, and badges all work (and don't crash on unknowns).
  const currentStatus = toThaiWorkflowStatus(request.workflowStatus) as BorrowWorkflowStatus
  const isTerminal = isBorrowWorkflowTerminal(currentStatus)

  // Parse AI recommendation
  let aiResult: ReturnType<typeof aiRecommendationResultSchema.safeParse> | null = null
  if (request.aiRecommendationResult) {
    aiResult = aiRecommendationResultSchema.safeParse(request.aiRecommendationResult)
  }

  // Next-action routing per stage.
  //   Pre-delivery stages → arrow nav (← revert / → next), image1 layout.
  //   เตรียมจัดส่ง → single forward arrow, image2 layout.
  //   อนุมัติ / จัดส่งสำเร็จ / รอคืน → dedicated form pages.
  //   คืนอุปกรณ์ → one-tap advance to ปิดรายการ.
  const PRE_DELIVERY_STATUSES = ["รับคำร้อง", "ประเมินผู้ป่วย", "AI แนะนำอุปกรณ์", "ตรวจสอบคลังอุปกรณ์"]
  const isPreDelivery = PRE_DELIVERY_STATUSES.includes(currentStatus)
  const isPrepare = currentStatus === "เตรียมจัดส่ง"
  const needsDeliverPage = currentStatus === "อนุมัติ"
  const needsLoanPage = currentStatus === "จัดส่งสำเร็จ"
  const needsReturnPage = currentStatus === "รอคืน"
  const isReturned = currentStatus === "คืนอุปกรณ์"

  type ForwardTarget = { type: "link"; href: string } | { type: "advance"; toStatus: string }
  const NAV: Record<string, { label: string; forward: ForwardTarget }> = {
    "รับคำร้อง": { label: "ประเมินผู้ป่วย", forward: { type: "advance", toStatus: "ประเมินผู้ป่วย" } },
    "ประเมินผู้ป่วย": {
      label: "ประเมินผู้ป่วยและสั่งใช้อุปกรณ์",
      forward: { type: "link", href: `/requests/${requestId}/assess` },
    },
    "AI แนะนำอุปกรณ์": {
      label: "ดูคำแนะนำอุปกรณ์จาก AI",
      forward: { type: "link", href: `/requests/${requestId}/ai` },
    },
    "ตรวจสอบคลังอุปกรณ์": {
      label: "ตรวจสอบและอนุมัติ / ไม่อนุมัติ",
      forward: { type: "link", href: `/requests/${requestId}/approve` },
    },
    "เตรียมจัดส่ง": { label: "ยืนยันจัดส่งสำเร็จ", forward: { type: "advance", toStatus: "จัดส่งสำเร็จ" } },
  }
  const nav = NAV[currentStatus]

  // Show the fulfillment tracker once the request has been approved.
  const showTracker = [
    "อนุมัติ",
    "เตรียมจัดส่ง",
    "จัดส่งสำเร็จ",
    "รอคืน",
    "คืนอุปกรณ์",
    "ปิดรายการ",
  ].includes(currentStatus) && request.approvalDecision === "อนุมัติ"

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

        {/* Fulfillment tracker (delivery-app style) — shown after approval */}
        {showTracker && (
          <Card>
            <CardContent className="pt-4">
              <DeliveryTracker currentStatus={currentStatus} />
            </CardContent>
          </Card>
        )}

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
              {(() => {
                // Multi-select stores staffDecisionEquipmentTypes; fall back to the
                // legacy singular field for results saved before multi-select.
                const decided =
                  aiResult.data.staffDecisionEquipmentTypes ??
                  (aiResult.data.staffDecisionEquipmentType
                    ? [aiResult.data.staffDecisionEquipmentType]
                    : [])
                return decided.length > 0 ? (
                  <div className="text-sm text-gray-600 pt-1">
                    <span className="font-medium">เจ้าหน้าที่เลือก: </span>
                    {decided.join(", ")}
                  </div>
                ) : null
              })()}
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

        {/* Approval / rejection outcome */}
        {request.approvalDecision === "อนุมัติ" && request.approverName && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">การอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="ผลการพิจารณา" value={<span className="text-green-600 font-medium">อนุมัติ</span>} />
              <Row label="ชื่อผู้อนุมัติ" value={request.approverName} />
            </CardContent>
          </Card>
        )}
        {request.approvalDecision === "ไม่อนุมัติ" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">การไม่อนุมัติ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="ผลการพิจารณา" value={<span className="text-red-600 font-medium">ไม่อนุมัติ</span>} />
              <Row label="สาเหตุ" value={request.rejectionReason ?? "-"} />
            </CardContent>
          </Card>
        )}

        {/* Delivery plan (recorded at the "เตรียมจัดส่ง" stage) */}
        {(request.delivererName || request.deliveryDate) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ข้อมูลการจัดส่ง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {request.deliveryDate && (
                <Row label="วันที่จัดส่ง" value={formatThaiDate(request.deliveryDate)} />
              )}
              {request.dueOrReturnDate && (
                <Row label="กำหนดคืนอุปกรณ์" value={formatThaiDate(request.dueOrReturnDate)} />
              )}
              {request.delivererName && (
                <Row label="ชื่อผู้จัดส่ง" value={request.delivererName} />
              )}
              {request.requestDetail && (
                <Row label="รายละเอียดคำร้อง" value={request.requestDetail} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Delivery-success confirmation (shown at the "จัดส่งสำเร็จ" stage) */}
        {currentStatus === "จัดส่งสำเร็จ" && (
          <Card className="border-teal-200 bg-teal-50/60">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-base font-bold text-teal-700">จัดส่งอุปกรณ์สำเร็จแล้ว</p>
                  <p className="text-sm text-gray-700">
                    {request.assignedEquipmentItem
                      ? `${toThaiEquipmentType(request.assignedEquipmentItem.equipmentType)} (${request.assignedEquipmentItem.assetNumber})`
                      : "ส่งมอบอุปกรณ์ให้ผู้ป่วยเรียบร้อย"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active loan (recorded at the "รอคืน" stage) */}
        {request.receivedDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ข้อมูลการยืม</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="วันที่รับอุปกรณ์" value={formatThaiDate(request.receivedDate)} />
              {request.loanDetail && (
                <Row label="รายละเอียดการยืม" value={request.loanDetail} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Return details (recorded at the "คืนอุปกรณ์" stage) */}
        {request.returnRecord && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ข้อมูลการคืนอุปกรณ์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Row label="วันที่รับคืน" value={formatThaiDate(request.returnRecord.returnDate)} />
              <Row label="ผู้รับคืน" value={request.returnRecord.receivingStaffName} />
              <Row
                label="สภาพอุปกรณ์"
                value={
                  <span
                    className={
                      request.returnRecord.condition === "ชำรุด"
                        ? "text-red-600 font-medium"
                        : "text-green-600 font-medium"
                    }
                  >
                    {request.returnRecord.condition}
                  </span>
                }
              />
              {request.returnRecord.damageNote && (
                <Row label="หมายเหตุความเสียหาย" value={request.returnRecord.damageNote} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Next action buttons */}
        {!isTerminal && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">การดำเนินการถัดไป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Pre-delivery stages → ← revert / → next arrows (image1) */}
              {isPreDelivery && nav && (
                <NextActionNav
                  requestId={requestId}
                  forwardLabel={nav.label}
                  forward={nav.forward}
                  showBack
                  backEnabled={currentStatus !== "รับคำร้อง"}
                />
              )}

              {/* เตรียมจัดส่ง → single forward arrow (image2) */}
              {isPrepare && nav && (
                <NextActionNav
                  requestId={requestId}
                  forwardLabel={nav.label}
                  forward={nav.forward}
                  showBack={false}
                  backEnabled={false}
                />
              )}

              {/* Approved → link to prepare-delivery form */}
              {needsDeliverPage && (
                <Link href={`/requests/${requestId}/deliver`} className="block">
                  <Button className="w-full">เตรียมจัดส่งอุปกรณ์</Button>
                </Link>
              )}

              {/* Delivered → link to loan / waiting-return form */}
              {needsLoanPage && (
                <Link href={`/requests/${requestId}/loan`} className="block">
                  <Button className="w-full">เริ่มการยืม (รอคืน)</Button>
                </Link>
              )}

              {/* Return stage → link to return page */}
              {needsReturnPage && (
                <Link href={`/requests/${requestId}/return`} className="block">
                  <Button className="w-full">บันทึกการรับคืนอุปกรณ์</Button>
                </Link>
              )}

              {/* Returned → one-tap advance to close the request */}
              {isReturned && (
                <WorkflowActions requestId={requestId} nextStatuses={["ปิดรายการ"]} />
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
