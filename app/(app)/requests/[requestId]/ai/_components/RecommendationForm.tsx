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

// Score → semantic tier. Higher suitability reads success; mid reads info; low warning.
function scoreTone(pct: number): { text: string; bar: string; chip: string } {
  if (pct >= 80)
    return { text: "text-success", bar: "bg-success", chip: "bg-success-soft text-success-text" }
  if (pct >= 50)
    return { text: "text-info", bar: "bg-info", chip: "bg-info-soft text-info-text" }
  return { text: "text-warning", bar: "bg-warning", chip: "bg-warning-soft text-warning-text" }
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
          <div className="absolute inset-0 animate-ping rounded-full bg-info-soft" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-info-soft">
            <Sparkles className="h-7 w-7 text-info" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted">กำลังวิเคราะห์อาการด้วย AI...</p>
      </div>
    )
  }

  const hasContext = Boolean(patientCondition?.trim() || assessmentSummary?.trim())
  const recommendedTypes = recommendations.map((r) => r.equipmentType)
  const otherTypes = EQUIPMENT_TYPES.filter((t) => !recommendedTypes.includes(t))

  const counter = (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-info-soft px-3 py-1 text-xs font-semibold text-info-text">
      เลือกแล้ว {selected.length}/{MAX_EQUIPMENT}
    </span>
  )

  return (
    <div className="space-y-4">
      {/* Assessment context — the AI ranks primarily on this */}
      {hasContext && (
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-info-soft">
              <Stethoscope className="h-4 w-4 text-info" />
            </span>
            อ้างอิงจากผลประเมินอาการ
          </div>
          <dl className="mt-3.5 space-y-2.5">
            {patientCondition?.trim() && (
              <div className="flex gap-3 text-sm">
                <dt className="w-24 shrink-0 text-faint">อาการป่วย</dt>
                <dd className="flex-1 text-foreground">{patientCondition}</dd>
              </div>
            )}
            {assessmentSummary?.trim() && (
              <div className="flex gap-3 text-sm">
                <dt className="w-24 shrink-0 text-faint">ประเมินอาการ</dt>
                <dd className="flex-1 text-foreground">{assessmentSummary}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Fallback notice — AI unavailable, staff picks manually */}
      {fallback && (
        <div className="flex items-start gap-3 rounded-lg border border-warning bg-warning-soft p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-warning-text">ระบบ AI ไม่พร้อมใช้งาน</p>
            <p className="mt-0.5 text-xs text-warning-text">
              {fallbackMessage ?? "กรุณาเลือกอุปกรณ์ด้วยตนเองด้านล่าง"}
            </p>
          </div>
        </div>
      )}

      {/* AI ranked recommendations — presented as a single "question" card */}
      {recommendations.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-info/30 bg-info-soft/40 shadow-sm">
          {/* card header — AI label + selection counter */}
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-info-text">
              <Sparkles className="h-3.5 w-3.5" />
              คำแนะนำจาก AI
            </span>
            {counter}
          </div>

          {/* question prompt */}
          <div className="px-5 pt-5">
            <h2 className="text-lg font-bold leading-snug text-foreground">
              เลือกอุปกรณ์ที่เหมาะสมกับผู้ป่วย
            </h2>
            <p className="mt-1 text-xs text-muted">
              เรียงตามความเหมาะสมจากผลประเมินอาการ · เลือกได้ 1–{MAX_EQUIPMENT} รายการ
            </p>
          </div>

          {/* numbered option rows */}
          <ul className="mt-3 divide-y divide-hairline">
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
                      "group flex w-full items-start gap-3.5 px-5 py-4 text-left transition-all duration-150 ease-apple",
                      isSelected ? "bg-info-soft" : "hover:bg-info-soft/60",
                      disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
                    )}
                  >
                    {/* numbered circle */}
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-all duration-150 ease-apple",
                        isSelected
                          ? "border-info bg-info text-white"
                          : isTop
                            ? "border-info/40 bg-info-soft text-info-text"
                            : "border-border bg-surface text-faint",
                      )}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : rec.rankingOrder}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 font-semibold text-foreground">
                          {rec.equipmentType}
                        </span>
                        {isTop && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-text">
                            <Star className="h-3 w-3 fill-success text-success" />
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
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                        <div
                          className={cn("h-full rounded-full transition-all duration-150 ease-apple", tone.bar)}
                          style={{
                            width: `${Math.min(100, Math.max(0, rec.matchingScorePercentage))}%`,
                          }}
                        />
                      </div>

                      {rec.explanation && (
                        <p className="mt-2 text-xs leading-relaxed text-muted">
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
        <section className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
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
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ease-apple",
                    checked
                      ? "border-info bg-info-soft text-info-text"
                      : "border-border bg-surface text-muted hover:border-faint",
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
      <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
        <Label htmlFor="staffOverrideNote" className="text-sm font-semibold text-foreground">
          หมายเหตุการตัดสินใจ
        </Label>
        <p className="mb-2.5 mt-0.5 text-xs text-muted">
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
        <p className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger-text">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="h-12 w-full text-base"
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
