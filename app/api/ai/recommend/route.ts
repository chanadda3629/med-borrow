import { NextRequest, NextResponse } from "next/server"
import { getAIRecommendation } from "@/lib/integrations/openrouter/recommendation"
import { medicalAssessmentSchema } from "@/lib/domain/schemas"
import { z } from "zod"

const bodySchema = medicalAssessmentSchema.extend({ gender: z.string().min(1) })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = bodySchema.parse(body)
    const result = await getAIRecommendation({
      age: data.age, gender: data.gender, chronicDiseases: data.chronicDiseases,
      checklistAnswers: data.checklistAnswers, urgencyLevel: data.urgencyLevel,
      patientCondition: data.patientCondition, walkingAbility: data.walkingAbility,
      selfCareAbility: data.selfCareAbility,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "ไม่สามารถรับคำแนะนำได้" }, { status: 500 })
  }
}
