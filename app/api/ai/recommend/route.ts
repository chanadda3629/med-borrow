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

  // The AI call itself — failures here are 500.
  try {
    const result = await getAIRecommendation({
      age: data.age, gender: data.gender, chronicDiseases: data.chronicDiseases,
      checklistAnswers: data.checklistAnswers, urgencyLevel: data.urgencyLevel,
      patientCondition: data.patientCondition, walkingAbility: data.walkingAbility,
      selfCareAbility: data.selfCareAbility,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ไม่สามารถรับคำแนะนำได้" },
      { status: 500 }
    )
  }
}
