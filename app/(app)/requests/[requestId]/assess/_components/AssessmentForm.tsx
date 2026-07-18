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
  Minus,
  Plus,
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

  // Equipment checklist: type -> quantity. Presence in the map = checked.
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(initial.prescribedEquipment.map((e) => [e.equipmentType, e.quantity])),
  )

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleEquipment(type: EquipmentType) {
    setQuantities((prev) => {
      const next = { ...prev }
      if (type in next) {
        delete next[type]
      } else {
        next[type] = 1
      }
      return next
    })
    setError(null)
  }

  function setQuantity(type: EquipmentType, qty: number) {
    setQuantities((prev) => ({ ...prev, [type]: Math.min(99, Math.max(1, qty)) }))
  }

  function handleReset() {
    setAssessorName("")
    setAssessedAt(todayISO())
    setPatientCondition("")
    setUrgencyLevel(URGENCY_LEVELS[0])
    setAssessmentSummary("")
    setUsageRecommendation("")
    setEquipmentNote("")
    setQuantities({})
    setError(null)
  }

  async function handleSubmit() {
    const prescribedEquipment = Object.entries(quantities).map(([equipmentType, quantity]) => ({
      equipmentType,
      quantity,
    }))

    if (!assessorName.trim()) return setError("กรุณากรอกชื่อผู้ประเมิน")
    if (!patientCondition.trim()) return setError("กรุณากรอกอาการป่วยของผู้ป่วย")
    if (!assessmentSummary.trim()) return setError("กรุณากรอกผลการประเมินอาการเบื้องต้น")
    if (prescribedEquipment.length === 0) return setError("กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ")

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
      router.push(`/requests/${requestId}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Section 1: Patient info */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-blue-600" />
            ข้อมูลผู้ป่วย
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>ชื่อผู้ป่วย</Label>
            <div className="flex h-12 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-base font-medium text-gray-900">
              {patientName}
            </div>
          </div>

          <div>
            <Label htmlFor="patientCondition">
              อาการป่วย <span className="text-red-500">*</span>
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
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              ระดับความเร่งด่วน <span className="text-red-500">*</span>
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
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            ผลการประเมินอาการ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="assessorName" className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-gray-400" />
                ชื่อผู้ประเมิน <span className="text-red-500">*</span>
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
                <CalendarDays className="h-4 w-4 text-gray-400" />
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
              <ClipboardCheck className="h-4 w-4 text-gray-400" />
              ประเมินอาการเบื้องต้น <span className="text-red-500">*</span>
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
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-blue-600" />
            อุปกรณ์ที่ต้องการใช้งาน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
              ชื่ออุปกรณ์ (เลือกได้หลายรายการ) <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 space-y-2">
              {EQUIPMENT_TYPES.map((type) => {
                const checked = type in quantities
                return (
                  <div
                    key={type}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 transition-colors",
                      checked ? "border-blue-500 bg-blue-50" : "border-gray-200",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleEquipment(type)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                          checked ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300",
                        )}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{type}</span>
                    </button>

                    {checked && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">จำนวน</span>
                        <QuantityStepper
                          value={quantities[type]}
                          onChange={(q) => setQuantity(type, q)}
                        />
                      </div>
                    )}
                  </div>
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
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

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-gray-300 bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="ลดจำนวน"
        className="flex h-9 w-9 items-center justify-center text-gray-600 disabled:opacity-30"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-7 text-center text-sm font-semibold text-gray-900">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        aria-label="เพิ่มจำนวน"
        className="flex h-9 w-9 items-center justify-center text-gray-600 disabled:opacity-30"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
