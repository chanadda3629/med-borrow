import { callOpenRouter } from "./ai-client"
import { aiRecommendationResultSchema } from "@/lib/domain/schemas"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"

export interface AssessmentPayload {
  age: number
  gender: string
  chronicDiseases: string[]
  checklistAnswers: string[]
  urgencyLevel: string
  patientCondition: string
  walkingAbility: string
  selfCareAbility: string
  // Free-text initial symptom assessment from the "ประเมินผู้ป่วย" form. This is
  // the primary signal the ranking should be based on.
  assessmentSummary?: string
}

export async function getAIRecommendation(payload: AssessmentPayload) {
  const equipment = EQUIPMENT_TYPES.join(", ")
  const system = `คุณเป็นผู้เชี่ยวชาญด้านการดูแลผู้ป่วยแบบประคองกาย ให้คำแนะนำอุปกรณ์ที่เหมาะสม
ตอบเป็น JSON: {"recommendations":[{"equipmentType":"...","matchingScorePercentage":95,"explanation":"...","rankingOrder":1}]}
อุปกรณ์ที่มี: ${equipment}
แนะนำเฉพาะจากรายการนี้ จัดอันดับความเหมาะสมโดยยึด "ผลการประเมินอาการเบื้องต้น" และอาการป่วยของผู้ป่วยเป็นหลัก เรียงจากคะแนนสูงสุด`

  const user = `ผู้ป่วยอายุ ${payload.age} ปี เพศ${payload.gender}
โรคประจำตัว: ${payload.chronicDiseases.join(", ") || "ไม่มี"}
ความสามารถเดิน: ${payload.walkingAbility}
การดูแลตนเอง: ${payload.selfCareAbility}
อาการป่วย: ${payload.patientCondition} ความเร่งด่วน: ${payload.urgencyLevel}
ผลการประเมินอาการเบื้องต้น: ${payload.assessmentSummary?.trim() || "-"}
รายการประเมิน: ${payload.checklistAnswers.join(", ") || "-"}`

  const raw = await callOpenRouter([{ role: "system", content: system }, { role: "user", content: user }])
  return aiRecommendationResultSchema.parse(JSON.parse(raw))
}
