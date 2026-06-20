"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useForm, FormProvider, Controller, useFormContext } from "react-hook-form"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ThaiAddressFields } from "@/components/forms/ThaiAddressFields"
import { PhotoUploadField } from "@/components/forms/PhotoUploadField"
import { createPatient } from "@/lib/actions/patients/create-patient"
import { EQUIPMENT_TYPES, CHECKLIST_OPTIONS, WALKING_ABILITIES, SELF_CARE_ABILITIES } from "@/lib/domain/constants"
import type { EquipmentType, AIRecommendationResult } from "@/lib/domain/schemas"
import { ChevronLeft, ChevronRight, Check, Loader2, AlertCircle } from "lucide-react"

// Dynamic import of the map to avoid SSR issues with Leaflet
const LeafletMapPicker = dynamic(
  () => import("@/components/maps/LeafletMapPicker").then((m) => m.LeafletMapPicker),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">กำลังโหลดแผนที่...</div> }
)

// ─── Form shape ─────────────────────────────────────────────────────────────

interface WizardFormValues {
  // Step 1
  fullName: string
  nationalId: string
  dateOfBirth: string
  age: number
  gender: string
  phoneNumber: string
  // Step 2
  address: {
    houseNumber: string
    moo: string
    province: string
    district: string
    subdistrict: string
    postalCode: string
  }
  location: {
    latitude: number
    longitude: number
    googleMapsUrl: string
  }
  // Step 3
  patientPhotos: Array<{ url: string; publicId: string }>
  homeEnvironmentPhotos: Array<{ url: string; publicId: string }>
  // Step 4
  medicalAssessment: {
    age: number
    chronicDiseases: string
    walkingAbility: string
    selfCareAbility: string
    patientCondition: string
    urgencyLevel: string
    checklistAnswers: string[]
  }
  // Step 5
  staffDecisionEquipmentType: EquipmentType
}

// ─── Step labels ─────────────────────────────────────────────────────────────

const STEPS = [
  "ข้อมูลส่วนตัว",
  "ที่อยู่และแผนที่",
  "รูปภาพ",
  "ประเมินอาการ",
  "AI แนะนำ",
  "สรุปข้อมูล",
] as const

// ─── Shared field-error helper ────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-red-600 text-xs mt-1">{message}</p>
}

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

function Step1Personal() {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const dob = watch("dateOfBirth")

  // Auto-calculate age from dateOfBirth
  useEffect(() => {
    if (!dob) return
    const birth = new Date(dob)
    if (isNaN(birth.getTime())) return
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    setValue("age", age >= 0 ? age : 0)
  }, [dob, setValue])

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
        <Input
          id="fullName"
          placeholder="กรอกชื่อ-นามสกุล"
          {...register("fullName", { required: "กรุณากรอกชื่อ-นามสกุล" })}
        />
        <FieldError message={errors.fullName?.message} />
      </div>

      <div>
        <Label htmlFor="nationalId">เลขบัตรประชาชน (13 หลัก)</Label>
        <Input
          id="nationalId"
          placeholder="0000000000000"
          maxLength={13}
          inputMode="numeric"
          {...register("nationalId", {
            required: "กรุณากรอกเลขบัตรประชาชน",
            pattern: { value: /^\d{13}$/, message: "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก" },
          })}
        />
        <FieldError message={errors.nationalId?.message} />
      </div>

      <div>
        <Label htmlFor="dateOfBirth">วันเกิด</Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...register("dateOfBirth", { required: "กรุณาเลือกวันเกิด" })}
        />
        <FieldError message={errors.dateOfBirth?.message} />
      </div>

      <div>
        <Label htmlFor="age">อายุ (คำนวณอัตโนมัติ)</Label>
        <Input
          id="age"
          type="number"
          readOnly
          className="bg-gray-50"
          {...register("age")}
        />
      </div>

      <div>
        <Label htmlFor="gender">เพศ</Label>
        <Controller
          name="gender"
          control={control}
          rules={{ required: "กรุณาเลือกเพศ" }}
          render={({ field }) => (
            <Select id="gender" {...field}>
              <option value="">-- เลือกเพศ --</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
              <option value="อื่น ๆ">อื่น ๆ</option>
            </Select>
          )}
        />
        <FieldError message={errors.gender?.message} />
      </div>

      <div>
        <Label htmlFor="phoneNumber">เบอร์โทรศัพท์ (10 หลัก)</Label>
        <Input
          id="phoneNumber"
          placeholder="08x-xxx-xxxx"
          maxLength={10}
          inputMode="numeric"
          {...register("phoneNumber", {
            required: "กรุณากรอกเบอร์โทรศัพท์",
            pattern: {
              value: /^0(?:6|8|9)\d{8}$/,
              message: "เบอร์โทรศัพท์ต้องเป็นเบอร์มือถือไทยที่ถูกต้อง",
            },
          })}
        />
        <FieldError message={errors.phoneNumber?.message} />
      </div>
    </div>
  )
}

// ─── Step 2: Address & Map ────────────────────────────────────────────────────

function Step2Address() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const lat = watch("location.latitude")
  const lng = watch("location.longitude")

  const handlePinChange = useCallback(
    (data: { latitude: number; longitude: number; googleMapsUrl: string }) => {
      setValue("location.latitude", data.latitude)
      setValue("location.longitude", data.longitude)
      setValue("location.googleMapsUrl", data.googleMapsUrl)
    },
    [setValue]
  )

  const addrErrors = errors.address as Record<string, { message?: string }> | undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="houseNumber">บ้านเลขที่</Label>
          <Input
            id="houseNumber"
            placeholder="123/4"
            {...register("address.houseNumber", { required: "กรุณากรอกบ้านเลขที่" })}
          />
          <FieldError message={addrErrors?.houseNumber?.message} />
        </div>
        <div>
          <Label htmlFor="moo">หมู่ที่ (ถ้ามี)</Label>
          <Input id="moo" placeholder="หมู่ 5" {...register("address.moo")} />
        </div>
      </div>

      <ThaiAddressFields />

      <div className="space-y-2">
        <Label>ปักหมุดที่อยู่บนแผนที่</Label>
        <p className="text-xs text-gray-500">แตะที่แผนที่เพื่อระบุตำแหน่งบ้านผู้ป่วย</p>
        <LeafletMapPicker onPinChange={handlePinChange} />
        {lat !== 0 && lng !== 0 && (
          <p className="text-xs text-green-600 font-medium">
            พิกัด: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        )}
        {errors.location?.latitude && (
          <p className="text-red-600 text-xs">กรุณาปักหมุดตำแหน่งบนแผนที่</p>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Photos ───────────────────────────────────────────────────────────

function Step3Photos() {
  const { watch, setValue } = useFormContext<WizardFormValues>()
  const patientPhotos = watch("patientPhotos") ?? []
  const homeEnvPhotos = watch("homeEnvironmentPhotos") ?? []

  // Handle multi-photo: we show up to 3 slots per category
  function handlePatientPhotoChange(
    index: number,
    data: { url: string; publicId: string } | undefined
  ) {
    const updated = [...patientPhotos]
    if (data) {
      updated[index] = data
    } else {
      updated.splice(index, 1)
    }
    setValue("patientPhotos", updated)
  }

  function handleHomePhotoChange(
    index: number,
    data: { url: string; publicId: string } | undefined
  ) {
    const updated = [...homeEnvPhotos]
    if (data) {
      updated[index] = data
    } else {
      updated.splice(index, 1)
    }
    setValue("homeEnvironmentPhotos", updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>รูปภาพผู้ป่วย</Label>
        <p className="text-xs text-gray-500 mb-3">อัปโหลดรูปภาพผู้ป่วย (สูงสุด 3 รูป)</p>
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <PhotoUploadField
              key={i}
              label={`รูปที่ ${i + 1}`}
              value={patientPhotos[i]}
              onChange={(data) => handlePatientPhotoChange(i, data)}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>รูปภาพสภาพแวดล้อมบ้าน</Label>
        <p className="text-xs text-gray-500 mb-3">
          ถ่ายรูปภายในบ้านเพื่อประกอบการพิจารณาอุปกรณ์ (สูงสุด 3 รูป)
        </p>
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <PhotoUploadField
              key={i}
              label={`รูปที่ ${i + 1}`}
              value={homeEnvPhotos[i]}
              onChange={(data) => handleHomePhotoChange(i, data)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Medical Assessment ───────────────────────────────────────────────

function Step4Assessment() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const assessErrors = errors.medicalAssessment as Record<string, { message?: string }> | undefined

  return (
    <div className="space-y-4">
      <div>
        <Label>ความสามารถในการเดิน</Label>
        <div className="space-y-2 mt-2">
          {WALKING_ABILITIES.map((ability) => (
            <label key={ability} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <Controller
                name="medicalAssessment.walkingAbility"
                control={control}
                rules={{ required: "กรุณาเลือกความสามารถในการเดิน" }}
                render={({ field }) => (
                  <input
                    type="radio"
                    value={ability}
                    checked={field.value === ability}
                    onChange={() => field.onChange(ability)}
                    className="w-4 h-4 text-blue-600"
                  />
                )}
              />
              <span className="text-sm text-gray-700">{ability}</span>
            </label>
          ))}
        </div>
        <FieldError message={assessErrors?.walkingAbility?.message} />
      </div>

      <div>
        <Label>ความสามารถในการดูแลตนเอง</Label>
        <div className="space-y-2 mt-2">
          {SELF_CARE_ABILITIES.map((ability) => (
            <label key={ability} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
              <Controller
                name="medicalAssessment.selfCareAbility"
                control={control}
                rules={{ required: "กรุณาเลือกความสามารถในการดูแลตนเอง" }}
                render={({ field }) => (
                  <input
                    type="radio"
                    value={ability}
                    checked={field.value === ability}
                    onChange={() => field.onChange(ability)}
                    className="w-4 h-4 text-blue-600"
                  />
                )}
              />
              <span className="text-sm text-gray-700">{ability}</span>
            </label>
          ))}
        </div>
        <FieldError message={assessErrors?.selfCareAbility?.message} />
      </div>

      <div>
        <Label htmlFor="patientCondition">สภาพผู้ป่วย</Label>
        <Textarea
          id="patientCondition"
          placeholder="อธิบายสภาพและอาการของผู้ป่วย..."
          {...register("medicalAssessment.patientCondition", {
            required: "กรุณากรอกสภาพผู้ป่วย",
          })}
        />
        <FieldError message={assessErrors?.patientCondition?.message} />
      </div>

      <div>
        <Label htmlFor="urgencyLevel">ระดับความเร่งด่วน</Label>
        <Controller
          name="medicalAssessment.urgencyLevel"
          control={control}
          rules={{ required: "กรุณาเลือกระดับความเร่งด่วน" }}
          render={({ field }) => (
            <Select id="urgencyLevel" {...field}>
              <option value="">-- เลือกระดับความเร่งด่วน --</option>
              <option value="ปกติ">ปกติ</option>
              <option value="เร่งด่วน">เร่งด่วน</option>
              <option value="เร่งด่วนมาก">เร่งด่วนมาก</option>
            </Select>
          )}
        />
        <FieldError message={assessErrors?.urgencyLevel?.message} />
      </div>

      <div>
        <Label htmlFor="chronicDiseases">โรคประจำตัว (คั่นด้วยเครื่องหมายจุลภาค)</Label>
        <Textarea
          id="chronicDiseases"
          placeholder="เช่น เบาหวาน, ความดันโลหิตสูง, มะเร็ง"
          {...register("medicalAssessment.chronicDiseases")}
        />
        <p className="text-xs text-gray-400 mt-1">ถ้าไม่มีสามารถเว้นว่างได้</p>
      </div>

      <div>
        <Label>รายการตรวจสอบอาการ</Label>
        <p className="text-xs text-gray-500 mb-2">เลือกทุกข้อที่ตรงกับสภาพผู้ป่วย</p>
        <div className="space-y-2">
          {CHECKLIST_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
            >
              <Controller
                name="medicalAssessment.checklistAnswers"
                control={control}
                rules={{ validate: (v) => (v && v.length > 0) || "กรุณาเลือกอย่างน้อย 1 ข้อ" }}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value?.includes(option) ?? false}
                    onChange={(e) => {
                      const current = field.value ?? []
                      if (e.target.checked) {
                        field.onChange([...current, option])
                      } else {
                        field.onChange(current.filter((v: string) => v !== option))
                      }
                    }}
                  />
                )}
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        <FieldError message={assessErrors?.checklistAnswers?.message} />
      </div>
    </div>
  )
}

// ─── Step 5: AI Recommendation ────────────────────────────────────────────────

interface AIRecommendationItem {
  equipmentType: EquipmentType
  matchingScorePercentage: number
  explanation?: string
  rankingOrder: number
}

function Step5AIRecommend() {
  const { watch, setValue } = useFormContext<WizardFormValues>()
  const [recommendations, setRecommendations] = useState<AIRecommendationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const selectedEquipment = watch("staffDecisionEquipmentType")

  const walkingAbility = watch("medicalAssessment.walkingAbility")
  const selfCareAbility = watch("medicalAssessment.selfCareAbility")
  const patientCondition = watch("medicalAssessment.patientCondition")
  const urgencyLevel = watch("medicalAssessment.urgencyLevel")
  const chronicDiseasesRaw = watch("medicalAssessment.chronicDiseases")
  const checklistAnswers = watch("medicalAssessment.checklistAnswers")
  const age = watch("age")

  async function fetchRecommendations() {
    setLoading(true)
    setAiError(null)
    try {
      const chronicDiseases = chronicDiseasesRaw
        ? chronicDiseasesRaw
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []

      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          chronicDiseases,
          walkingAbility,
          selfCareAbility,
          patientCondition,
          urgencyLevel,
          checklistAnswers,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(errData.error ?? "ไม่สามารถรับคำแนะนำจาก AI ได้")
      }

      const data = await res.json() as AIRecommendationResult
      setRecommendations(data.recommendations as AIRecommendationItem[])
      // Auto-select top recommendation if staff hasn't chosen yet
      if (!selectedEquipment && data.recommendations.length > 0) {
        setValue("staffDecisionEquipmentType", data.recommendations[0].equipmentType as EquipmentType)
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ")
    } finally {
      setLoading(false)
    }
  }

  // Run once on mount via a ref flag to avoid triggering setState synchronously
  // inside the effect body; the actual setState calls happen asynchronously inside
  // the async fetchRecommendations function.
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    fetchRecommendations().catch(() => {})
    // fetchRecommendations is a stable closure defined in the same component render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">คำแนะนำจาก AI</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            AI วิเคราะห์ข้อมูลและแนะนำอุปกรณ์ที่เหมาะสม เจ้าหน้าที่เป็นผู้ตัดสินใจขั้นสุดท้าย
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchRecommendations()}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "โหลดใหม่"}
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-gray-500">กำลังวิเคราะห์ข้อมูล...</p>
        </div>
      )}

      {aiError && !loading && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">ไม่สามารถโหลดคำแนะนำ AI</p>
            <p className="text-xs text-red-600 mt-0.5">{aiError}</p>
            <p className="text-xs text-gray-500 mt-2">กรุณาเลือกอุปกรณ์ด้วยตนเองด้านล่าง</p>
          </div>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations
            .sort((a, b) => a.rankingOrder - b.rankingOrder)
            .map((rec) => (
              <button
                key={rec.equipmentType}
                type="button"
                onClick={() => setValue("staffDecisionEquipmentType", rec.equipmentType)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  selectedEquipment === rec.equipmentType
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{rec.equipmentType}</span>
                    <Badge variant={rec.rankingOrder === 1 ? "default" : "secondary"}>
                      อันดับ {rec.rankingOrder}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-blue-700">
                    {rec.matchingScorePercentage}%
                  </span>
                </div>
                <Progress value={rec.matchingScorePercentage} className="mb-2" />
                {rec.explanation && (
                  <p className="text-xs text-gray-600 mt-1">{rec.explanation}</p>
                )}
                {selectedEquipment === rec.equipmentType && (
                  <div className="flex items-center gap-1 mt-2 text-blue-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">เลือกแล้ว</span>
                  </div>
                )}
              </button>
            ))}
        </div>
      )}

      <div className="pt-2 border-t border-gray-100">
        <Label htmlFor="staffDecisionEquipmentType">เลือกอุปกรณ์ด้วยตนเอง (Override)</Label>
        <Controller
          name="staffDecisionEquipmentType"
          render={({ field }) => (
            <Select id="staffDecisionEquipmentType" {...field}>
              <option value="">-- เลือกอุปกรณ์ --</option>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          )}
        />
        <p className="text-xs text-gray-400 mt-1">
          เจ้าหน้าที่สามารถเลือกอุปกรณ์ที่แตกต่างจาก AI ได้
        </p>
      </div>
    </div>
  )
}

// ─── Step 6: Summary ──────────────────────────────────────────────────────────

function Step6Summary() {
  const { watch } = useFormContext<WizardFormValues>()
  const values = watch()

  const chronicList = values.medicalAssessment?.chronicDiseases
    ? values.medicalAssessment.chronicDiseases
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    : []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="ชื่อ-นามสกุล" value={values.fullName} />
          <Row label="เลขบัตรประชาชน" value={values.nationalId} />
          <Row label="วันเกิด" value={values.dateOfBirth} />
          <Row label="อายุ" value={`${values.age} ปี`} />
          <Row label="เพศ" value={values.gender} />
          <Row label="เบอร์โทร" value={values.phoneNumber} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ที่อยู่</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row
            label="ที่อยู่"
            value={[
              values.address?.houseNumber,
              values.address?.moo ? `หมู่ ${values.address.moo}` : "",
              values.address?.subdistrict,
              values.address?.district,
              values.address?.province,
              values.address?.postalCode,
            ]
              .filter(Boolean)
              .join(" ")}
          />
          {values.location?.latitude !== 0 && (
            <Row
              label="พิกัด GPS"
              value={`${values.location?.latitude?.toFixed(6)}, ${values.location?.longitude?.toFixed(6)}`}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>การประเมินอาการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="การเดิน" value={values.medicalAssessment?.walkingAbility} />
          <Row label="การดูแลตนเอง" value={values.medicalAssessment?.selfCareAbility} />
          <Row label="สภาพผู้ป่วย" value={values.medicalAssessment?.patientCondition} />
          <Row label="ระดับความเร่งด่วน" value={values.medicalAssessment?.urgencyLevel} />
          {chronicList.length > 0 && (
            <Row label="โรคประจำตัว" value={chronicList.join(", ")} />
          )}
          {values.medicalAssessment?.checklistAnswers?.length > 0 && (
            <Row
              label="รายการตรวจสอบ"
              value={values.medicalAssessment.checklistAnswers.join(", ")}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>อุปกรณ์ที่ขอยืม</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base font-semibold text-blue-700">
            {values.staffDecisionEquipmentType || "ยังไม่ได้เลือก"}
          </p>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนกดบันทึก เมื่อบันทึกแล้วระบบจะสร้างคำร้องขอยืมอุปกรณ์
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 min-w-[120px] flex-shrink-0">{label}:</span>
      <span className="text-gray-900 break-all">{value ?? "-"}</span>
    </div>
  )
}

// ─── Wizard Shell ─────────────────────────────────────────────────────────────

export function PatientIntakeWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useForm<WizardFormValues>({
    defaultValues: {
      fullName: "",
      nationalId: "",
      dateOfBirth: "",
      age: 0,
      gender: "",
      phoneNumber: "",
      address: {
        houseNumber: "",
        moo: "",
        province: "",
        district: "",
        subdistrict: "",
        postalCode: "",
      },
      location: {
        latitude: 0,
        longitude: 0,
        googleMapsUrl: "",
      },
      patientPhotos: [],
      homeEnvironmentPhotos: [],
      medicalAssessment: {
        age: 0,
        chronicDiseases: "",
        walkingAbility: "" as WizardFormValues["medicalAssessment"]["walkingAbility"],
        selfCareAbility: "" as WizardFormValues["medicalAssessment"]["selfCareAbility"],
        patientCondition: "",
        urgencyLevel: "",
        checklistAnswers: [],
      },
      staffDecisionEquipmentType: "" as EquipmentType,
    },
    mode: "onTouched",
  })

  const { trigger, getValues } = methods

  // Fields to validate per step
  const stepFields: Record<number, string[]> = {
    0: ["fullName", "nationalId", "dateOfBirth", "gender", "phoneNumber"],
    1: [
      "address.houseNumber",
      "address.province",
      "address.district",
      "address.subdistrict",
      "address.postalCode",
    ],
    2: [],
    3: [
      "medicalAssessment.walkingAbility",
      "medicalAssessment.selfCareAbility",
      "medicalAssessment.patientCondition",
      "medicalAssessment.urgencyLevel",
      "medicalAssessment.checklistAnswers",
    ],
    4: ["staffDecisionEquipmentType"],
    5: [],
  }

  async function handleNext() {
    const fields = (stepFields[step] ?? []) as string[]
    const valid =
      fields.length > 0
        ? await trigger(fields as Parameters<typeof trigger>[0])
        : true
    if (valid) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit() {
    const values = getValues()
    setSubmitting(true)
    setSubmitError(null)

    try {
      const chronicDiseases = values.medicalAssessment.chronicDiseases
        ? values.medicalAssessment.chronicDiseases
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []

      const result = await createPatient({
        fullName: values.fullName,
        nationalId: values.nationalId,
        dateOfBirth: values.dateOfBirth,
        age: values.age,
        gender: values.gender,
        phoneNumber: values.phoneNumber,
        address: {
          houseNumber: values.address.houseNumber,
          moo: values.address.moo || undefined,
          province: values.address.province,
          district: values.address.district,
          subdistrict: values.address.subdistrict,
          postalCode: values.address.postalCode,
        },
        location: {
          latitude: values.location.latitude,
          longitude: values.location.longitude,
          googleMapsUrl:
            values.location.googleMapsUrl ||
            `https://www.google.com/maps?q=${values.location.latitude},${values.location.longitude}`,
        },
        patientPhotos: values.patientPhotos,
        homeEnvironmentPhotos: values.homeEnvironmentPhotos,
        medicalAssessment: {
          age: values.age,
          chronicDiseases,
          walkingAbility: values.medicalAssessment.walkingAbility,
          selfCareAbility: values.medicalAssessment.selfCareAbility,
          patientCondition: values.medicalAssessment.patientCondition,
          urgencyLevel: values.medicalAssessment.urgencyLevel,
          checklistAnswers: values.medicalAssessment.checklistAnswers,
        },
        staffDecisionEquipmentType: values.staffDecisionEquipmentType,
      })

      if (!result.success) {
        setSubmitError(result.error)
        return
      }

      router.push(`/requests/${result.data.requestId}`)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่")
    } finally {
      setSubmitting(false)
    }
  }

  const stepComponents = [
    <Step1Personal key="step1" />,
    <Step2Address key="step2" />,
    <Step3Photos key="step3" />,
    <Step4Assessment key="step4" />,
    <Step5AIRecommend key="step5" />,
    <Step6Summary key="step6" />,
  ]

  const isLastStep = step === STEPS.length - 1

  return (
    <FormProvider {...methods}>
      {/* Step indicator */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  i === step ? "text-blue-600 font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>
      </div>

      {/* Step content */}
      <div className="p-4 pb-32">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          ขั้นตอนที่ {step + 1}: {STEPS[step]}
        </h2>
        {stepComponents[step]}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mx-4 mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Navigation buttons — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 safe-area-inset-bottom">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0 || submitting}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4" />
          ย้อนกลับ
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                บันทึกคำร้อง
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleNext()}
            className="flex-1"
          >
            ถัดไป
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </FormProvider>
  )
}
