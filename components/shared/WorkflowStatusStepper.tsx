import { cn } from "@/lib/utils"
import { WORKFLOW_DISPLAY_STEPS } from "@/lib/domain/constants"

// The approve / reject decision renders as a *single* visual step
// ("อนุมัติ / ไม่อนุมัติ"); see WORKFLOW_DISPLAY_STEPS for the grouping.
export function WorkflowStatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIdx = WORKFLOW_DISPLAY_STEPS.findIndex((s) => s.statuses.includes(currentStatus))
  const isRejected = currentStatus === "ไม่อนุมัติ"

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {WORKFLOW_DISPLAY_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          // The decision step turns red when the request was rejected.
          const rejectedHere = isCurrent && isRejected
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  rejectedHere ? "bg-danger text-white" :
                  isDone ? "bg-success text-white" :
                  isCurrent ? "bg-accent-500 text-white" :
                  "bg-hairline text-muted"
                )}>{idx + 1}</div>
                <span className={cn("text-xs text-center w-16 leading-tight",
                  rejectedHere ? "text-danger-text font-medium" :
                  isCurrent ? "text-accent-700 font-medium" : "text-muted"
                )}>{step.label}</span>
              </div>
              {idx < WORKFLOW_DISPLAY_STEPS.length - 1 && (
                <div className={cn("w-6 h-0.5 mb-5", isDone ? "bg-success" : "bg-hairline")} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
