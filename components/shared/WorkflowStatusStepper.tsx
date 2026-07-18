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
                  rejectedHere ? "bg-red-500 text-white" :
                  isDone ? "bg-green-500 text-white" :
                  isCurrent ? "bg-blue-600 text-white" :
                  "bg-gray-200 text-gray-500"
                )}>{idx + 1}</div>
                <span className={cn("text-xs text-center w-16 leading-tight",
                  rejectedHere ? "text-red-600 font-medium" :
                  isCurrent ? "text-blue-600 font-medium" : "text-gray-500"
                )}>{step.label}</span>
              </div>
              {idx < WORKFLOW_DISPLAY_STEPS.length - 1 && (
                <div className={cn("w-6 h-0.5 mb-5", isDone ? "bg-green-400" : "bg-gray-200")} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
