import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import { prescribedEquipmentItemSchema } from "@/lib/domain/schemas"
import { z } from "zod"
import { PageHeader } from "@/components/layout/PageHeader"
import { AssessmentForm } from "./_components/AssessmentForm"

interface PageProps {
  params: Promise<{ requestId: string }>
}

function toISODate(date: Date | null | undefined): string {
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

export default async function AssessRequestPage({ params }: PageProps) {
  const { requestId } = await params

  const request = await db.borrowingRequest.findUnique({
    where: { id: requestId },
    include: { patient: { include: { medicalAssessment: true } } },
  })

  if (!request) notFound()

  // Only allow assessment while the request is in the "ประเมินผู้ป่วย" stage.
  if (toThaiWorkflowStatus(request.workflowStatus) !== "ประเมินผู้ป่วย") {
    redirect(`/requests/${requestId}`)
  }

  const assessment = request.patient.medicalAssessment
  const prescribed = z
    .array(prescribedEquipmentItemSchema)
    .safeParse(assessment?.prescribedEquipment ?? [])

  return (
    <div>
      <PageHeader title="ฟอร์มประเมินและสั่งใช้อุปกรณ์" showBack />

      <div className="p-4 pb-24">
        <p className="mb-4 text-sm text-muted">
          คำร้อง {request.requestNumber}
          {request.patient.reporterName ? ` · ผู้แจ้ง: ${request.patient.reporterName}` : ""}
        </p>
        <AssessmentForm
          requestId={requestId}
          patientName={request.patient.fullName}
          initial={{
            assessorName: assessment?.assessorName ?? "",
            assessedAt: toISODate(assessment?.assessedAt),
            patientCondition: assessment?.patientCondition || request.patient.patientCondition || "",
            urgencyLevel: assessment?.urgencyLevel || request.patient.urgencyLevel || "",
            assessmentSummary: assessment?.assessmentSummary ?? "",
            usageRecommendation: assessment?.usageRecommendation ?? "",
            equipmentNote: assessment?.equipmentNote ?? "",
            prescribedEquipment: prescribed.success ? prescribed.data : [],
          }}
        />
      </div>
    </div>
  )
}
