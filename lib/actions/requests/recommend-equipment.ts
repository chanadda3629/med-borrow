"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canTransitionBorrowWorkflowStatus } from "@/lib/domain/transitions"
import { confirmRecommendationSchema } from "@/lib/domain/schemas"
import type { AIRecommendation } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"
import { getAIRecommendation } from "@/lib/integrations/openrouter/recommendation"
import type { Prisma } from "@prisma/client"

interface RecommendationFetchResult {
  recommendations: AIRecommendation[]
  fallback: boolean
  message?: string
}

// a) Read-only: ask the AI for a ranked equipment list for a request at the
// "AI แนะนำอุปกรณ์" stage. Called server-to-server (no HTTP hop). Mirrors the
// /api/ai/recommend contract: on any AI failure it degrades to
// { recommendations: [], fallback: true } so the workflow is never blocked.
export async function fetchRecommendations(requestId: string) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const request = await db.borrowingRequest.findUnique({
      where: { id: requestId },
      include: { patient: { include: { medicalAssessment: true } } },
    })
    if (!request) return err("ไม่พบคำร้อง")

    const from = toThaiWorkflowStatus(request.workflowStatus)
    if (from !== "AI แนะนำอุปกรณ์") {
      return err("คำร้องนี้ไม่ได้อยู่ในขั้นตอน AI แนะนำอุปกรณ์")
    }

    const patient = request.patient
    const assessment = patient.medicalAssessment

    // The AI is a second opinion on the human assessment. Prefer the assessment's
    // current condition/urgency; fall back to the patient record when absent.
    try {
      const result = await getAIRecommendation({
        age: assessment?.age ?? patient.age,
        gender: patient.gender,
        chronicDiseases: patient.chronicDiseases,
        walkingAbility: assessment?.walkingAbility ?? patient.walkingAbility,
        selfCareAbility: assessment?.selfCareAbility ?? patient.selfCareAbility,
        patientCondition: assessment?.patientCondition ?? patient.patientCondition,
        urgencyLevel: assessment?.urgencyLevel ?? patient.urgencyLevel,
        checklistAnswers: assessment?.checklistAnswers ?? [],
      })
      return ok<RecommendationFetchResult>({
        recommendations: result.recommendations,
        fallback: false,
      })
    } catch (aiError) {
      // Never surface raw provider errors or patient PII; log the reason for ops.
      console.error(
        "AI recommendation unavailable:",
        aiError instanceof Error ? aiError.message : aiError,
      )
      return ok<RecommendationFetchResult>({
        recommendations: [],
        fallback: true,
        message: "ระบบ AI ไม่พร้อมใช้งานขณะนี้ กรุณาเลือกอุปกรณ์เอง",
      })
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}

// b) Write: persist the staff decision (AI is decision support only) and advance
// to "ตรวจสอบคลังอุปกรณ์". The AI result is optional — when the provider failed the
// staff still confirms an equipment type and the workflow still advances.
export async function confirmRecommendation(requestId: string, input: unknown) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const parsed = confirmRecommendationSchema.safeParse(input)
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง")
    }
    const data = parsed.data

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    const from = toThaiWorkflowStatus(request.workflowStatus)
    if (from !== "AI แนะนำอุปกรณ์") {
      return err("คำร้องนี้ไม่ได้อยู่ในขั้นตอน AI แนะนำอุปกรณ์")
    }
    if (!canTransitionBorrowWorkflowStatus("AI แนะนำอุปกรณ์", "ตรวจสอบคลังอุปกรณ์")) {
      return err("ไม่สามารถเปลี่ยนสถานะได้")
    }

    const overrideNote = data.staffOverrideNote?.trim() || undefined

    // Store the full AI result merged with the staff decision, so the read-only
    // detail card can show both the ranking and what staff chose. Only written
    // when the AI actually returned a result.
    let storedResult: Prisma.InputJsonValue | undefined
    if (data.aiRecommendationResult) {
      storedResult = {
        ...data.aiRecommendationResult,
        staffDecisionEquipmentType: data.staffDecisionEquipmentType,
        ...(overrideNote ? { staffOverrideNote: overrideNote } : {}),
      } as unknown as Prisma.InputJsonValue
    }

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: {
          ...(storedResult ? { aiRecommendationResult: storedResult } : {}),
          requestedEquipmentType: data.staffDecisionEquipmentType,
          workflowStatus: "ตรวจสอบคลังอุปกรณ์",
        },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: from, toStatus: "ตรวจสอบคลังอุปกรณ์" },
      }),
    ])

    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
