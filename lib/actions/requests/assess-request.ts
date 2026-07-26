"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canTransitionBorrowWorkflowStatus } from "@/lib/domain/transitions"
import { assessmentFormSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import type { Prisma } from "@prisma/client"

// Records the "ประเมินผู้ป่วย" assessment: staff note the patient's condition and
// urgency, write a preliminary finding, and prescribe one or more equipment types
// with quantities. Saving the assessment advances the request to "AI แนะนำอุปกรณ์".
export async function assessRequest(requestId: string, input: unknown) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const parsed = assessmentFormSchema.safeParse(input)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง")
    }
    const data = parsed.data

    const request = await db.borrowingRequest.findUnique({
      where: { id: requestId },
      include: { patient: true },
    })
    if (!request) return err("ไม่พบคำร้อง")

    // Normalize legacy English-coded statuses before the stage check.
    const from = toThaiWorkflowStatus(request.workflowStatus)
    if (from !== "ประเมินผู้ป่วย") {
      return err("คำร้องนี้ไม่ได้อยู่ในขั้นตอนประเมินผู้ป่วย")
    }
    if (!canTransitionBorrowWorkflowStatus("ประเมินผู้ป่วย", "AI แนะนำอุปกรณ์")) {
      return err("ไม่สามารถเปลี่ยนสถานะได้")
    }

    // The single-item approval flow later assigns one serialized item, so the first
    // prescribed type becomes the request's primary equipment type. The full list
    // (with quantities) is kept on the assessment as decision support.
    const primaryEquipmentType = data.prescribedEquipment[0].equipmentType
    const assessedAt = data.assessedAt ?? new Date()
    const usageRecommendation = data.usageRecommendation?.trim() || null
    const equipmentNote = data.equipmentNote?.trim() || null
    const prescribedEquipment = data.prescribedEquipment as unknown as Prisma.InputJsonValue

    await db.$transaction([
      db.medicalAssessment.upsert({
        where: { patientId: request.patientId },
        create: {
          patientId: request.patientId,
          age: request.patient.age,
          walkingAbility: request.patient.walkingAbility,
          selfCareAbility: request.patient.selfCareAbility,
          patientCondition: data.patientCondition,
          urgencyLevel: data.urgencyLevel,
          checklistAnswers: [],
          assessedAt,
          assessorName: data.assessorName,
          assessmentSummary: data.assessmentSummary,
          usageRecommendation,
          prescribedEquipment,
          equipmentNote,
        },
        update: {
          age: request.patient.age,
          patientCondition: data.patientCondition,
          urgencyLevel: data.urgencyLevel,
          assessedAt,
          assessorName: data.assessorName,
          assessmentSummary: data.assessmentSummary,
          usageRecommendation,
          prescribedEquipment,
          equipmentNote,
        },
      }),
      db.patient.update({
        where: { id: request.patientId },
        data: {
          patientCondition: data.patientCondition,
          urgencyLevel: data.urgencyLevel,
        },
      }),
      db.borrowingRequest.update({
        where: { id: requestId },
        data: {
          requestedEquipmentType: primaryEquipmentType,
          workflowStatus: "AI แนะนำอุปกรณ์",
        },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: from, toStatus: "AI แนะนำอุปกรณ์" },
      }),
    ])

    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
