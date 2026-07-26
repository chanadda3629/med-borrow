import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import { prescribedEquipmentItemSchema } from "@/lib/domain/schemas"
import { z } from "zod"
import { PageHeader } from "@/components/layout/PageHeader"
import { RecommendationForm } from "./_components/RecommendationForm"

interface PageProps {
  params: Promise<{ requestId: string }>
}

export default async function AIRecommendationPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: { patient: { include: { medicalAssessment: true } } },
  })

  if (!request) notFound()

  // Only reachable while the request is at the "AI แนะนำอุปกรณ์" stage.
  if (toThaiWorkflowStatus(request.workflowStatus) !== "AI แนะนำอุปกรณ์") {
    redirect(`/requests/${requestId}`)
  }

  // The prescribed-equipment list seeds the manual fallback picker when the AI
  // is unavailable.
  const assessment = request.patient.medicalAssessment
  const prescribed = z
    .array(prescribedEquipmentItemSchema)
    .safeParse(assessment?.prescribedEquipment ?? [])
  const prescribedEquipment = prescribed.success
    ? prescribed.data.map((e) => e.equipmentType)
    : []

  return (
    <div>
      <PageHeader title="คำแนะนำอุปกรณ์จาก AI" showBack />

      <div className="p-4 pb-24">
        <p className="mb-4 text-sm text-muted">
          คำร้อง {request.requestNumber} · ผู้ป่วย: {request.patient.fullName}
        </p>
        <RecommendationForm
          requestId={requestId}
          prescribedEquipment={prescribedEquipment}
          patientCondition={assessment?.patientCondition ?? request.patient.patientCondition ?? ""}
          assessmentSummary={assessment?.assessmentSummary ?? ""}
        />
      </div>
    </div>
  )
}
