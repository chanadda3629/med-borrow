"use client"
import { useState, useEffect, useCallback, type ComponentType } from "react"
import { useForm, FormProvider, Controller, useFormContext } from "react-hook-form"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ThaiAddressFields } from "@/components/forms/ThaiAddressFields"
import { PhotoGalleryUploadField } from "@/components/forms/PhotoGalleryUploadField"
import { createPatient } from "@/lib/actions/patients/create-patient"
import { formatThaiDate } from "@/lib/utils/format-thai-date"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  User,
  UserPlus,
  IdCard,
  CalendarDays,
  Users,
  Phone,
  Home,
  MapPinned,
  MapPin,
  ExternalLink,
} from "lucide-react"

// Dynamic import of the map to avoid SSR issues with Leaflet
const LeafletMapPicker = dynamic(
  () => import("@/components/maps/LeafletMapPicker").then((m) => m.LeafletMapPicker),
  { ssr: false, loading: () => <div className="h-64 w-full rounded-lg bg-canvas flex items-center justify-center text-faint">กำลังโหลดแผนที่...</div> }
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
  reporterName: string
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
}

// ─── Step labels ─────────────────────────────────────────────────────────────
//
// Intake captures the patient, address and photos only. The medical assessment
// and equipment selection happen later on the dedicated assessment page
// (/requests/[id]/assess) once the request reaches the "ประเมินผู้ป่วย" stage.

const STEPS = [
  "ข้อมูลส่วนตัว",
  "ที่อยู่และแผนที่",
  "รูปภาพ",
  "สรุปข้อมูล",
] as const

// ─── Shared field-error helper ────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-danger text-xs mt-1">{message}</p>
}

// Marks a field as required with a red asterisk, consistent across the form.
function RequiredLabel({
  icon: Icon,
  htmlFor,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-faint" />
      {children}
      <span className="text-danger">*</span>
    </Label>
  )
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
    <Card>
      <CardContent className="p-5 space-y-5">
        <div>
          <p className="text-xs font-medium text-faint tracking-wide uppercase">
            ข้อมูลผู้ป่วย
          </p>
          <p className="text-xs text-muted mt-1">
            กรุณากรอกข้อมูลที่มีเครื่องหมาย <span className="text-danger">*</span> ให้ครบถ้วนและถูกต้อง
          </p>
        </div>

        <div>
          <RequiredLabel icon={User} htmlFor="fullName">ชื่อ-นามสกุล</RequiredLabel>
          <Input
            id="fullName"
            placeholder="กรอกชื่อ-นามสกุล"
            {...register("fullName", { required: "กรุณากรอกชื่อ-นามสกุล" })}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

        <div>
          <RequiredLabel icon={IdCard} htmlFor="nationalId">เลขบัตรประชาชน (13 หลัก)</RequiredLabel>
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
          <RequiredLabel icon={CalendarDays} htmlFor="dateOfBirth">วันเกิด</RequiredLabel>
          <Controller
            name="dateOfBirth"
            control={control}
            rules={{ required: "กรุณาเลือกวันเกิด" }}
            render={({ field }) => (
              <DatePicker
                id="dateOfBirth"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                max={new Date().toISOString().split("T")[0]}
                hasError={!!errors.dateOfBirth}
                placeholder="เลือกวันเกิด"
              />
            )}
          />
          <FieldError message={errors.dateOfBirth?.message} />
        </div>

        <div>
          <Label htmlFor="age" className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-faint" />
            อายุ (คำนวณอัตโนมัติ)
          </Label>
          <Input
            id="age"
            type="number"
            readOnly
            className="bg-canvas"
            {...register("age")}
          />
        </div>

        <div>
          <RequiredLabel icon={Users} htmlFor="gender">เพศ</RequiredLabel>
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
          <RequiredLabel icon={Phone} htmlFor="phoneNumber">เบอร์โทรศัพท์ (10 หลัก)</RequiredLabel>
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

        <div>
          <RequiredLabel icon={UserPlus} htmlFor="reporterName">ชื่อญาติผู้ป่วย/ผู้แจ้ง</RequiredLabel>
          <Input
            id="reporterName"
            placeholder="กรอกชื่อญาติผู้ป่วยหรือผู้แจ้ง"
            {...register("reporterName", { required: "กรุณากรอกชื่อญาติผู้ป่วย/ผู้แจ้ง" })}
          />
          <FieldError message={errors.reporterName?.message} />
        </div>
      </CardContent>
    </Card>
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
      <Card>
        <CardContent className="p-5 space-y-5">
          <div>
            <p className="text-xs font-medium text-faint tracking-wide uppercase">
              ที่อยู่ผู้ป่วย
            </p>
            <p className="text-xs text-muted mt-1">
              กรุณากรอกข้อมูลที่มีเครื่องหมาย <span className="text-danger">*</span> ให้ครบถ้วนและถูกต้อง
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <RequiredLabel icon={Home} htmlFor="houseNumber">บ้านเลขที่</RequiredLabel>
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-2">
          <Label className="flex items-center gap-1.5">
            <MapPinned className="w-4 h-4 text-faint" />
            ปักหมุดที่อยู่บนแผนที่
          </Label>
          <p className="text-xs text-muted">
            ค้นหาสถานที่ แตะที่แผนที่ หรือกดปุ่มค้นหาตำแหน่งของฉันเพื่อระบุตำแหน่งบ้านผู้ป่วย
          </p>
          <LeafletMapPicker
            initialLat={lat || undefined}
            initialLng={lng || undefined}
            onPinChange={handlePinChange}
          />
          {errors.location?.latitude && (
            <p className="text-danger text-xs">กรุณาปักหมุดตำแหน่งบนแผนที่</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Step 3: Photos ───────────────────────────────────────────────────────────

const MAX_PHOTOS = 5

function Step3Photos() {
  const {
    control,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext<WizardFormValues>()
  const patientPhotoCount = (watch("patientPhotos") ?? []).length
  const homeEnvPhotoCount = (watch("homeEnvironmentPhotos") ?? []).length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="mb-0">
            รูปภาพผู้ป่วย <span className="text-danger">*</span>
          </Label>
          <Badge variant="secondary">{patientPhotoCount} / {MAX_PHOTOS}</Badge>
        </div>
        <p className="text-xs text-muted mb-3">
          อัปโหลดรูปภาพผู้ป่วยอย่างน้อย 1 รูป (สูงสุด {MAX_PHOTOS} รูป)
        </p>
        <Controller
          name="patientPhotos"
          control={control}
          rules={{
            validate: (v) => (v && v.length > 0) || "กรุณาอัปโหลดรูปภาพผู้ป่วยอย่างน้อย 1 รูป",
          }}
          render={({ field }) => (
            <PhotoGalleryUploadField
              value={field.value ?? []}
              onChange={(photos) => {
                field.onChange(photos)
                void trigger("patientPhotos")
              }}
              max={MAX_PHOTOS}
            />
          )}
        />
        <FieldError message={errors.patientPhotos?.message as string | undefined} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="mb-0">
            รูปภาพสภาพแวดล้อมบ้าน <span className="text-danger">*</span>
          </Label>
          <Badge variant="secondary">{homeEnvPhotoCount} / {MAX_PHOTOS}</Badge>
        </div>
        <p className="text-xs text-muted mb-3">
          ถ่ายรูปภายในบ้านเพื่อประกอบการพิจารณาอุปกรณ์อย่างน้อย 1 รูป (สูงสุด {MAX_PHOTOS} รูป)
        </p>
        <Controller
          name="homeEnvironmentPhotos"
          control={control}
          rules={{
            validate: (v) => (v && v.length > 0) || "กรุณาอัปโหลดรูปภาพสภาพแวดล้อมบ้านอย่างน้อย 1 รูป",
          }}
          render={({ field }) => (
            <PhotoGalleryUploadField
              value={field.value ?? []}
              onChange={(photos) => {
                field.onChange(photos)
                void trigger("homeEnvironmentPhotos")
              }}
              max={MAX_PHOTOS}
            />
          )}
        />
        <FieldError message={errors.homeEnvironmentPhotos?.message as string | undefined} />
      </div>
    </div>
  )
}
// ─── Step 4: Summary ──────────────────────────────────────────────────────────

function Step6Summary() {
  const { watch } = useFormContext<WizardFormValues>()
  const values = watch()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="ชื่อ-นามสกุล" value={values.fullName} />
          <Row label="เลขบัตรประชาชน" value={values.nationalId} />
          <Row
            label="วันเกิด"
            value={values.dateOfBirth ? formatThaiDate(new Date(values.dateOfBirth)) : ""}
          />
          <Row label="อายุ" value={`${values.age} ปี`} />
          <Row label="เพศ" value={values.gender} />
          <Row label="เบอร์โทร" value={values.phoneNumber} />
          <Row label="ญาติผู้ป่วย/ผู้แจ้ง" value={values.reporterName} />
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
            <div className="flex gap-2">
              <span className="text-muted min-w-[120px] flex-shrink-0">
                ตำแหน่งบนแผนที่:
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${values.location?.latitude},${values.location?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-accent-600 hover:text-accent-700 hover:underline font-medium break-all"
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>เปิดใน Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-warning-soft rounded-lg border border-warning/20">
        <p className="text-sm text-warning-text">
          กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนกดบันทึก เมื่อบันทึกแล้วระบบจะสร้างคำร้อง
          และดำเนินการประเมินอาการในขั้นตอนถัดไป
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted min-w-[120px] flex-shrink-0">{label}:</span>
      <span className="text-foreground break-all">{value ?? "-"}</span>
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
      reporterName: "",
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
    },
    mode: "onTouched",
  })

  const { trigger, getValues } = methods

  // Fields to validate per step
  const stepFields: Record<number, string[]> = {
    0: ["fullName", "nationalId", "dateOfBirth", "gender", "phoneNumber", "reporterName"],
    1: [
      "address.houseNumber",
      "address.province",
      "address.district",
      "address.subdistrict",
      "address.postalCode",
    ],
    2: ["patientPhotos", "homeEnvironmentPhotos"],
    3: [],
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
      const result = await createPatient({
        fullName: values.fullName,
        nationalId: values.nationalId,
        dateOfBirth: values.dateOfBirth,
        age: values.age,
        gender: values.gender,
        phoneNumber: values.phoneNumber,
        reporterName: values.reporterName,
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
    <Step6Summary key="step4" />,
  ]

  const isLastStep = step === STEPS.length - 1

  return (
    <FormProvider {...methods}>
      {/* Step indicator */}
      <div className="px-4 py-3 bg-canvas border-b border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-150 ease-apple ${
                  i < step
                    ? "bg-success text-white"
                    : i === step
                    ? "bg-accent-500 text-white"
                    : "bg-hairline text-muted"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  i === step ? "text-accent-600 font-medium" : "text-faint"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border flex-shrink-0" />}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Progress value={((step + 1) / STEPS.length) * 100} />
        </div>
      </div>

      {/* Step content */}
      <div className="p-4 pb-32">
        <h2 className="text-base font-semibold text-foreground mb-4">
          ขั้นตอนที่ {step + 1}: {STEPS[step]}
        </h2>
        {stepComponents[step]}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mx-4 mb-4 p-3 bg-danger-soft rounded-lg border border-danger/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-text">{submitError}</p>
        </div>
      )}

      {/* Navigation buttons — fixed above the global bottom tab bar (h-16) */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-surface border-t border-border p-4 flex gap-3 safe-area-inset-bottom">
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
