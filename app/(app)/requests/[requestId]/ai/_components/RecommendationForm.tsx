"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Loader2, Sparkles, Star, Stethoscope } from "lucide-react"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"
import type { AIRecommendation, EquipmentType } from "@/lib/domain/schemas"
import {
  fetchRecommendations,
  confirmRecommendation,
} from "@/lib/actions/requests/recommend-equipment"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RecommendationFormProps {
  requestId: string
  // Prescribed equipment from the assessment — seeds the manual picker.
  prescribedEquipment: EquipmentType[]
  // Assessment context shown to staff and fed to the AI ranking.
  patientCondition: string
  assessmentSummary: string
}

// Staff may confirm between 1 and MAX_EQUIPMENT equipment types.
const MAX_EQUIPMENT = 5

// Score → colour tier. Higher suitability reads greener; lower reads amber.
function scoreTone(pct: number): { text: string; bar: string; chip: string } {
  if (pct >= 80)
    return { text: "text-emerald-600", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" }
  if (pct >= 50)
    return { text: "text-sky-600", bar: "bg-sky-500", chip: "bg-sky-50 text-sky-700" }
  return { text: "text-amber-600", bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700" }
}

export function RecommendationForm({
  requestId,
  prescribedEquipment,
  patientCondition,
  assessmentSummary,
}: RecommendationFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [fallback, setFallback] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)

  // 1–5 selected equipment types (order preserved; the first is the primary).
  const [selected, setSelected] = useState<EquipmentType[]>([])
  const [overrideNote, setOverrideNote] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Run the AI fetch once on mount. The ref flag prevents a double-invoke under
  // React strict mode; the setState calls happen asynchronously inside load().
  const didFetch = useRef(false)
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true

    async function load() {
      setLoading(true)
      const result = await fetchRecommendations(requestId)
      if (!result.success) {
        setFallback(true)
        setFallbackMessage(result.error)
        seedManualSelection()
        setLoading(false)
        return
      }

      const data = result.data
      const ranked = [...data.recommendations].sort(
        (a, b) => a.rankingOrder - b.rankingOrder,
      )
      setRecommendations(ranked)
      setFallback(data.fallback)
      setFallbackMessage(data.message ?? null)

      if (ranked.length > 0) {
        setSelected([ranked[0].equipmentType])
      } else {
        seedManualSelection()
      }
      setLoading(false)
    }

    function seedManualSelection() {
      if (prescribedEquipment.length > 0) {
        setSelected(prescribedEquipment.slice(0, MAX_EQUIPMENT))
      }
    }

    void load()
    // load/seedManualSelection are stable closures for this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleEquipment(type: EquipmentType) {
    setError(null)
    setSelected((prev) => {
      if (prev.includes(type)) return prev.filter((t) => t !== type)
      if (prev.length >= MAX_EQUIPMENT) {
        setError(`เลือกอุปกรณ์ได้สูงสุด ${MAX_EQUIPMENT} รายการ`)
        return prev
      }
      return [...prev, type]
    })
  }

  async function handleConfirm() {
    if (selected.length === 0) {
      setError("กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ")
      return
    }
    setError(null)
    setSubmitting(true)
    const result = await confirmRecommendation(requestId, {
      aiRecommendationResult:
        recommendations.length > 0 ? { recommendations } : undefined,
      staffDecisionEquipmentTypes: selected,
      staffOverrideNote: overrideNote,
    })
    if (!result.success) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    router.push(`/requests/${requestId}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-sky-200/50" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-sky-100">
            <Sparkles className="h-7 w-7 text-sky-500" />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500">กำลังวิเคราะห์อาการด้วย AI...</p>
      </div>
    )
  }

  const hasContext = Boolean(patientCondition?.trim() || assessmentSummary?.trim())
  const recommendedTypes = recommendations.map((r) => r.equipmentType)
  const otherTypes = EQUIPMENT_TYPES.filter((t) => !recommendedTypes.includes(t))

  const counter = (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
      เลือกแล้ว {selected.length}/{MAX_EQUIPMENT}
    </span>
  )

  return (
    <div className="space-y-4">
      {/* Assessment context — the AI ranks primarily on this */}
      {hasContext && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50">
              <Stethoscope className="h-4 w-4 text-sky-500" />
            </span>
            อ้างอิงจากผลประเมินอาการ
          </div>
          <dl className="mt-3.5 space-y-2.5">
            {patientCondition?.trim() && (
              <div className="flex gap-3 text-sm">
                <dt className="w-24 shrink-0 text-gray-400">อาการป่วย</dt>
                <dd className="flex-1 text-gray-700">{patientCondition}</dd>
              </div>
            )}
            {assessmentSummary?.trim() && (
              <div className="flex gap-3 text-sm">
                <dt className="w-24 shrink-0 text-gray-400">ประเมินอาการ</dt>
                <dd className="flex-1 text-gray-700">{assessmentSummary}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Fallback notice — AI unavailable, staff picks manually */}
      {fallback && (
        <div className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-700">ระบบ AI ไม่พร้อมใช้งาน</p>
            <p className="mt-0.5 text-xs text-amber-600">
              {fallbackMessage ?? "กรุณาเลือกอุปกรณ์ด้วยตนเองด้านล่าง"}
            </p>
          </div>
        </div>
      )}

      {/* AI ranked recommendations — presented as a single "question" card */}
      {recommendations.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          {/* card header — AI label + selection counter */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-600">
              <Sparkles className="h-3.5 w-3.5" />
              คำแนะนำจาก AI
            </span>
            {counter}
          </div>

          {/* question prompt */}
          <div className="px-5 pt-5">
            <h2 className="text-lg font-bold leading-snug text-gray-900">
              เลือกอุปกรณ์ที่เหมาะสมกับผู้ป่วย
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              เรียงตามความเหมาะสมจากผลประเมินอาการ · เลือกได้ 1–{MAX_EQUIPMENT} รายการ
            </p>
          </div>

          {/* numbered option rows */}
          <ul className="mt-3 divide-y divide-gray-100">
            {recommendations.map((rec) => {
              const isSelected = selected.includes(rec.equipmentType)
              const disabled = !isSelected && selected.length >= MAX_EQUIPMENT
              const isTop = rec.rankingOrder === 1
              const tone = scoreTone(rec.matchingScorePercentage)
              return (
                <li key={rec.equipmentType}>
                  <button
                    type="button"
                    onClick={() => toggleEquipment(rec.equipmentType)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    className={cn(
                      "group flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors",
                      isSelected ? "bg-sky-50/70" : "hover:bg-gray-50/80",
                      disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
                    )}
                  >
                    {/* numbered circle */}
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                        isSelected
                          ? "border-sky-600 bg-sky-600 text-white"
                          : isTop
                            ? "border-sky-200 bg-sky-50 text-sky-600"
                            : "border-gray-200 bg-white text-gray-400",
                      )}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : rec.rankingOrder}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 font-semibold text-gray-900">
                          {rec.equipmentType}
                        </span>
                        {isTop && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                            เหมาะสมที่สุด
                          </span>
                        )}
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums",
                            tone.chip,
                          )}
                        >
                          {rec.matchingScorePercentage}%
                        </span>
                      </div>

                      {/* suitability bar */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={cn("h-full rounded-full transition-all", tone.bar)}
                          style={{
                            width: `${Math.min(100, Math.max(0, rec.matchingScorePercentage))}%`,
                          }}
                        />
                      </div>

                      {rec.explanation && (
                        <p className="mt-2 text-xs leading-relaxed text-gray-500">
                          {rec.explanation}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Manual picker: full checklist on fallback, "other equipment" chips otherwise */}
      {(recommendations.length === 0 || otherTypes.length > 0) && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-800">
              {recommendations.length === 0
                ? "เลือกอุปกรณ์"
                : "เพิ่มอุปกรณ์อื่น (ถ้าต้องการ)"}
            </h2>
            {recommendations.length === 0 && counter}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {(recommendations.length === 0 ? EQUIPMENT_TYPES : otherTypes).map((type) => {
              const checked = selected.includes(type)
              const disabled = !checked && selected.length >= MAX_EQUIPMENT
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleEquipment(type)}
                  disabled={disabled}
                  aria-pressed={checked}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    checked
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                  {type}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Decision note */}
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <Label htmlFor="staffOverrideNote" className="text-sm font-semibold text-gray-800">
          หมายเหตุการตัดสินใจ
        </Label>
        <p className="mb-2.5 mt-0.5 text-xs text-gray-400">
          เจ้าหน้าที่สามารถเลือกอุปกรณ์ที่แตกต่างจากที่ AI แนะนำได้
        </p>
        <Textarea
          id="staffOverrideNote"
          placeholder="เหตุผลหากเลือกต่างจาก AI (ถ้ามี)..."
          value={overrideNote}
          onChange={(e) => setOverrideNote(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="h-12 w-full rounded-2xl text-base"
        onClick={() => void handleConfirm()}
        disabled={submitting || selected.length === 0}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังบันทึก...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            ยืนยัน {selected.length} รายการ และตรวจสอบคลังอุปกรณ์
          </>
        )}
      </Button>
    </div>
  )
}
