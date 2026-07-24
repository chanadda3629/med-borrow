"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Loader2, Sparkles } from "lucide-react"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"
import type { AIRecommendation, EquipmentType } from "@/lib/domain/schemas"
import {
  fetchRecommendations,
  confirmRecommendation,
} from "@/lib/actions/requests/recommend-equipment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface RecommendationFormProps {
  requestId: string
  // Prescribed equipment from the assessment — seeds the manual picker.
  prescribedEquipment: EquipmentType[]
}

export function RecommendationForm({
  requestId,
  prescribedEquipment,
}: RecommendationFormProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [fallback, setFallback] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)

  const [selected, setSelected] = useState<EquipmentType | "">("")
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
        // Guard/lookup failure — degrade to the manual picker rather than blocking.
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
        // Pre-select the top-ranked item; staff can override.
        setSelected(ranked[0].equipmentType)
      } else {
        seedManualSelection()
      }
      setLoading(false)
    }

    function seedManualSelection() {
      if (prescribedEquipment.length > 0) {
        setSelected(prescribedEquipment[0])
      }
    }

    void load()
    // load/seedManualSelection are stable closures for this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConfirm() {
    if (!selected) {
      setError("กรุณาเลือกอุปกรณ์")
      return
    }
    setError(null)
    setSubmitting(true)
    const result = await confirmRecommendation(requestId, {
      aiRecommendationResult:
        recommendations.length > 0 ? { recommendations } : undefined,
      staffDecisionEquipmentType: selected,
      staffOverrideNote: overrideNote,
    })
    if (!result.success) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    // The action revalidates the detail route; a plain push lands on fresh data.
    router.push(`/requests/${requestId}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-sm text-gray-500">กำลังวิเคราะห์ข้อมูลด้วย AI...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* AI recommendation list */}
      {recommendations.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-purple-600" />
              คำแนะนำจาก AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-500">
              AI วิเคราะห์ข้อมูลและแนะนำอุปกรณ์ที่เหมาะสม เจ้าหน้าที่เป็นผู้ตัดสินใจขั้นสุดท้าย
            </p>
            {recommendations.map((rec) => {
              const isSelected = selected === rec.equipmentType
              return (
                <button
                  key={rec.equipmentType}
                  type="button"
                  onClick={() => setSelected(rec.equipmentType)}
                  className={cn(
                    "w-full rounded-xl border-2 p-4 text-left transition-colors",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {rec.equipmentType}
                      </span>
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
                    <p className="mt-1 text-xs text-gray-600">{rec.explanation}</p>
                  )}
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-blue-600">
                      <Check className="h-4 w-4" />
                      <span className="text-xs font-medium">เลือกแล้ว</span>
                    </div>
                  )}
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Fallback notice — AI unavailable, staff picks manually */}
      {fallback && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700">ระบบ AI ไม่พร้อมใช้งาน</p>
            <p className="mt-0.5 text-xs text-amber-600">
              {fallbackMessage ?? "กรุณาเลือกอุปกรณ์ด้วยตนเองด้านล่าง"}
            </p>
          </div>
        </div>
      )}

      {/* Manual selection / override */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">เลือกอุปกรณ์ (ยืนยัน / เปลี่ยนแปลง)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="staffDecisionEquipmentType">อุปกรณ์ที่เลือก</Label>
            <Select
              id="staffDecisionEquipmentType"
              value={selected}
              onChange={(e) => setSelected(e.target.value as EquipmentType)}
            >
              <option value="">-- เลือกอุปกรณ์ --</option>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-400">
              เจ้าหน้าที่สามารถเลือกอุปกรณ์ที่แตกต่างจากที่ AI แนะนำได้
            </p>
          </div>

          <div>
            <Label htmlFor="staffOverrideNote">หมายเหตุการตัดสินใจ</Label>
            <Textarea
              id="staffOverrideNote"
              placeholder="เหตุผลหากเลือกต่างจาก AI (ถ้ามี)..."
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={() => void handleConfirm()}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังบันทึก...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            ยืนยันและตรวจสอบคลังอุปกรณ์
          </>
        )}
      </Button>
    </div>
  )
}
