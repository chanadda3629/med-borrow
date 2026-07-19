"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { advanceWorkflow } from "@/lib/actions/requests/advance-workflow"
import { revertWorkflow } from "@/lib/actions/requests/revert-workflow"
import { Button } from "@/components/ui/button"

// Where the forward (→) arrow takes the request: either navigate to a dedicated
// form page, or advance the workflow status in place.
type Forward =
  | { type: "link"; href: string }
  | { type: "advance"; toStatus: string }

interface NextActionNavProps {
  requestId: string
  forwardLabel: string
  forward: Forward
  // Render the back (←) slot. Pre-delivery stages show it; เตรียมจัดส่ง does not.
  showBack: boolean
  // Whether the back arrow is actionable (false on the very first stage).
  backEnabled: boolean
}

export function NextActionNav({
  requestId,
  forwardLabel,
  forward,
  showBack,
  backEnabled,
}: NextActionNavProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleForward() {
    if (forward.type === "link") {
      router.push(forward.href)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const result = await advanceWorkflow(requestId, forward.toStatus)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleBack() {
    setError(null)
    setLoading(true)
    try {
      const result = await revertWorkflow(requestId)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button
            variant="outline"
            className="shrink-0"
            aria-label="ย้อนสถานะกลับ"
            disabled={loading || !backEnabled}
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Button
          className="flex-1 justify-center gap-2"
          disabled={loading}
          onClick={handleForward}
        >
          <span>{loading ? "กำลังดำเนินการ..." : forwardLabel}</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
