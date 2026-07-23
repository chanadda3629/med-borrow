import { NextRequest, NextResponse } from "next/server"
import { getAIRecommendation } from "@/lib/integrations/openrouter/recommendation"
import { medicalAssessmentSchema } from "@/lib/domain/schemas"
import { z } from "zod"

const bodySchema = medicalAssessmentSchema.extend({ gender: z.string().min(1) })

export async function POST(request: NextRequest) {
  // Validate first — a bad request body is a 400, not a 500.
  let data: z.infer<typeof bodySchema>
  try {
    const body = await request.json()
    data = bodySchema.parse(body)
  } catch (err) {
    const message =
      err instanceof z.ZodError ? "ข้อมูลไม่ครบถ้วนสำหรับการวิเคราะห์" : "คำขอไม่ถูกต้อง"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // The AI call is decision support only — staff can always pick equipment
  // manually. If it fails for any reason (missing key, OpenRouter outage, bad
  // JSON, schema mismatch), degrade gracefully to a manual-selection state with
  // a 200 rather than blocking the workflow with a 500.
  try {
    const result = await getAIRecommendation({
      age: data.age, gender: data.gender, chronicDiseases: data.chronicDiseases,
      checklistAnswers: data.checklistAnswers, urgencyLevel: data.urgencyLevel,
      patientCondition: data.patientCondition, walkingAbility: data.walkingAbility,
      selfCareAbility: data.selfCareAbility,
    })
    return NextResponse.json({ ...result, fallback: false })
  } catch (err) {
    // Log the detail server-side for ops; never surface raw provider errors to
    // the client (they can echo request payloads) or log patient PII.
    console.error("AI recommendation unavailable:", err instanceof Error ? err.message : err)
    return NextResponse.json({
      recommendations: [],
      fallback: true,
      message: "ระบบ AI ไม่พร้อมใช้งานขณะนี้ กรุณาเลือกอุปกรณ์เอง",
    })
  }
}
