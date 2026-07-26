"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Stethoscope,
  CalendarDays,
  AlertTriangle,
  ClipboardCheck,
  Package,
  Check,
  Loader2,
} from "lucide-react"
import { EQUIPMENT_TYPES, URGENCY_LEVELS } from "@/lib/domain/constants"
import { assessRequest } from "@/lib/actions/requests/assess-request"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

interface PrescribedItem {
  equipmentType: EquipmentType
  quantity: number
}

interface AssessmentInitialValues {
  assessorName: string
  assessedAt: string
  patientCondition: string
  urgencyLevel: string
  assessmentSummary: string
  usageRecommendation: string
  equipmentNote: string
  prescribedEquipment: PrescribedItem[]
}

interface AssessmentFormProps {
  requestId: string
  patientName: string
  initial: AssessmentInitialValues
}

const MAX_EQUIPMENT = 3

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

export function AssessmentForm({ requestId, patientName, initial }: AssessmentFormProps) {
  const router = useRouter()

  const [assessorName, setAssessorName] = useState(initial.assessorName)
  const [assessedAt, setAssessedAt] = useState(initial.assessedAt || todayISO())
  const [patientCondition, setPatientCondition] = useState(initial.patientCondition)
  const [urgencyLevel, setUrgencyLevel] = useState(initial.urgencyLevel || URGENCY_LEVELS[0])
  const [assessmentSummary, setAssessmentSummary] = useState(initial.assessmentSummary)
  const [usageRecommendation, setUsageRecommendation] = useState(initial.usageRecommendation)
  const [equipmentNote, setEquipmentNote] = useState(initial.equipmentNote)

  // Equipment checklist: selected types. Each selected type is a single unit (quantity 1),
  // and a request may select at most MAX_EQUIPMENT types.
  const [selected, setSelected] = useState<EquipmentType[]>(() =>
    initial.prescribedEquipment.map((e) => e.equipmentType),
  )

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleEquipment(type: EquipmentType) {
    if (selected.includes(type)) {
      setSelected((prev) => prev.filter((t) => t !== type))
      setError(null)
      return
    }
    if (selected.length >= MAX_EQUIPMENT) {
      setError(`เลือกอุปกรณ์ได้สูงสุด ${MAX_EQUIPMENT} รายการ`)
      return
    }
    setSelected((prev) => [...prev, type])
    setError(null)
  }

  function handleReset() {
    setAssessorName("")
    setAssessedAt(todayISO())
    setPatientCondition("")
    setUrgencyLevel(URGENCY_LEVELS[0])
    setAssessmentSummary("")
    setUsageRecommendation("")
    setEquipmentNote("")
    setSelected([])
    setError(null)
  }

  async function handleSubmit() {
    const prescribedEquipment = selected.map((equipmentType) => ({
      equipmentType,
      quantity: 1,
    }))

    if (!assessorName.trim()) return setError("กรุณากรอกชื่อผู้ประเมิน")
    if (!patientCondition.trim()) return setError("กรุณากรอกอาการป่วยของผู้ป่วย")
    if (!assessmentSummary.trim()) return setError("กรุณากรอกผลการประเมินอาการเบื้องต้น")
    if (prescribedEquipment.length === 0) return setError("กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ")
    if (prescribedEquipment.length > MAX_EQUIPMENT)
      return setError(`เลือกอุปกรณ์ได้สูงสุด ${MAX_EQUIPMENT} รายการ`)

    setError(null)
    setSubmitting(true)
    const result = await assessRequest(requestId, {
      assessorName,
      assessedAt,
      patientCondition,
      urgencyLevel,
      assessmentSummary,
      prescribedEquipment,
      usageRecommendation,
      equipmentNote,
    })
    if (!result.success) {
      setError(result.error)
      setSubmitting(false)
    } else {
      // The server action revalidates the detail route, so a plain push lands on
      // fresh data. Do NOT also call router.refresh() here — firing it right after
      // push cancels the pending navigation and strands the user on this page.
      router.push(`/requests/${requestId}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Section 1: Patient info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-accent-600" />
            ข้อมูลผู้ป่วย
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>ชื่อผู้ป่วย</Label>
            <div className="flex h-12 items-center rounded-md border border-border bg-surface-2 px-3 text-base font-medium text-foreground">
              {patientName}
            </div>
          </div>

          <div>
            <Label htmlFor="patientCondition">
              อาการป่วย <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="patientCondition"
              placeholder="อธิบายอาการป่วยของผู้ป่วย..."
              value={patientCondition}
              onChange={(e) => setPatientCondition(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="urgencyLevel" className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-faint" />
              ระดับความเร่งด่วน <span className="text-danger">*</span>
            </Label>
            <Select
              id="urgencyLevel"
              value={urgencyLevel}
              onChange={(e) => setUrgencyLevel(e.target.value)}
            >
              {URGENCY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Assessment result */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-accent-600" />
            ผลการประเมินอาการ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="assessorName" className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-faint" />
                ชื่อผู้ประเมิน <span className="text-danger">*</span>
              </Label>
              <Input
                id="assessorName"
                placeholder="ชื่อคุณหมอ / ผู้ประเมิน"
                value={assessorName}
                onChange={(e) => setAssessorName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="assessedAt" className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-faint" />
                วันที่ประเมิน
              </Label>
              <DatePicker
                id="assessedAt"
                value={assessedAt}
                onChange={setAssessedAt}
                max={todayISO()}
                placeholder="เลือกวันที่ประเมิน"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assessmentSummary" className="flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4 text-faint" />
              ประเมินอาการเบื้องต้น <span className="text-danger">*</span>
            </Label>
            <Textarea
              id="assessmentSummary"
              placeholder="สรุปผลการประเมินอาการเบื้องต้นของผู้ป่วย..."
              value={assessmentSummary}
              onChange={(e) => setAssessmentSummary(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Equipment needed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-accent-600" />
            อุปกรณ์ที่ต้องการใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="flex items-center justify-between">
              <span>
                ชื่ออุปกรณ์ (เลือกได้ 1–{MAX_EQUIPMENT} รายการ) <span className="text-danger">*</span>
              </span>
              <span className="text-xs font-normal text-muted">
                เลือกแล้ว {selected.length}/{MAX_EQUIPMENT}
              </span>
            </Label>
            <div className="mt-2 space-y-2">
              {EQUIPMENT_TYPES.map((type) => {
                const checked = selected.includes(type)
                const disabled = !checked && selected.length >= MAX_EQUIPMENT
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEquipment(type)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border-2 p-3 text-left transition-all duration-150 ease-apple",
                      checked ? "border-accent-500 bg-accent-50" : "border-hairline",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                        checked ? "border-accent-600 bg-accent-600 text-white" : "border-border",
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-sm font-medium text-foreground">{type}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="usageRecommendation">คำแนะนำการใช้อุปกรณ์</Label>
            <Textarea
              id="usageRecommendation"
              placeholder="คำแนะนำในการใช้งานอุปกรณ์ (ถ้ามี)..."
              value={usageRecommendation}
              onChange={(e) => setUsageRecommendation(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="equipmentNote">หมายเหตุ</Label>
            <Textarea
              id="equipmentNote"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)..."
              value={equipmentNote}
              onChange={(e) => setEquipmentNote(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger-text">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={handleReset}
          disabled={submitting}
        >
          ล้างข้อมูล
        </Button>
        <Button type="button" className="flex-1" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              บันทึกผลประเมิน
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
