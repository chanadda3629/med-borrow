import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { EQUIPMENT_STATUSES } from "@/lib/domain/constants"
import {
  toThaiWorkflowStatus,
  toThaiEquipmentType,
  toThaiEquipmentStatus,
  toEquipmentTypeCode,
} from "@/lib/domain/labels"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EquipmentIcon } from "@/app/(app)/dashboard/_components/equipment-icons"
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

  // Only allow approval when in the correct workflow stage. Normalize legacy
  // English-coded statuses first (matches the deliver/loan/detail pages).
  if (toThaiWorkflowStatus(request.workflowStatus) !== "ตรวจสอบคลังอุปกรณ์") {
    redirect(`/requests/${requestId}`)
  }

  // The requested type — and every equipment row — may be stored either as a Thai
  // label or as an English reference code (see prisma/seed.mjs). Match both forms
  // so the inventory summary and allocation list mirror the คลังอุปกรณ์ page.
  const thaiType = toThaiEquipmentType(request.requestedEquipmentType)
  const typeCandidates = Array.from(
    new Set([request.requestedEquipmentType, toEquipmentTypeCode(request.requestedEquipmentType), thaiType]),
  )

  const itemsOfType = await db.equipmentItem.findMany({
    where: { equipmentType: { in: typeCandidates } },
    orderBy: { equipmentCode: "asc" },
  })

  // Count items of this type per (Thai-normalized) status, for the คลังอุปกรณ์
  // summary. Ordered by the canonical status list so the breakdown reads the same
  // way every time.
  const statusCounts = new Map<string, number>()
  for (const item of itemsOfType) {
    const status = toThaiEquipmentStatus(item.currentStatus)
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
  }
  const statusBreakdown = EQUIPMENT_STATUSES.map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
  })).filter((row) => row.count > 0)

  // Allocatable items: ready ("พร้อมใช้งาน") and not already bound to a loan.
  const availableItems = itemsOfType.filter(
    (item) =>
      toThaiEquipmentStatus(item.currentStatus) === "พร้อมใช้งาน" && !item.currentLoanRequestId,
  )

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
            <Row label="ประเภทอุปกรณ์" value={thaiType} />
          </CardContent>
        </Card>

        {/* Inventory summary — mirrors the คลังอุปกรณ์ page for the requested type */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <EquipmentIcon type={thaiType} className="h-5 w-5 text-muted" />
                คลังอุปกรณ์: {thaiType}
              </CardTitle>
              <Link
                href={`/inventory?type=${encodeURIComponent(thaiType)}`}
                className="shrink-0 text-xs font-medium text-accent-600 hover:underline"
              >
                ดูในคลัง
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-2xl font-semibold text-success">
                  {availableItems.length}
                </div>
                <div className="text-xs text-muted">พร้อมใช้งาน</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{itemsOfType.length}</div>
                <div className="text-xs text-muted">ทั้งหมด</div>
              </div>
            </div>

            {statusBreakdown.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {statusBreakdown.map(({ status, count }) => (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <StatusBadge status={status} type="equipment" />
                    <span className="text-sm font-medium text-foreground">{count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">ยังไม่มีอุปกรณ์ประเภทนี้ในคลัง</p>
            )}
          </CardContent>
        </Card>

        {/* Approval decision */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              เลือกอุปกรณ์ที่จะจัดสรร ({availableItems.length} รายการพร้อมใช้งาน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApproveRequestForm
              requestId={requestId}
              availableItems={availableItems.map((item) => ({
                id: item.id,
                assetNumber: item.assetNumber,
                equipmentCode: item.equipmentCode,
              }))}
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
      <span className="text-sm text-muted w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground flex-1">{value}</span>
    </div>
  )
}
