import { BORROW_WORKFLOW_STATUSES } from "@/lib/domain/constants"
import { cn } from "@/lib/utils"

export function WorkflowStatusStepper({ currentStatus }: { currentStatus: string }) {
  const steps = BORROW_WORKFLOW_STATUSES
  const currentIdx = steps.indexOf(currentStatus as typeof steps[number])

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {steps.map((step, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  isDone ? "bg-green-500 text-white" :
                  isCurrent ? "bg-blue-600 text-white" :
                  "bg-gray-200 text-gray-500"
                )}>{idx + 1}</div>
                <span className={cn("text-xs text-center w-16 leading-tight",
                  isCurrent ? "text-blue-600 font-medium" : "text-gray-500"
                )}>{step}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn("w-6 h-0.5 mb-5", isDone ? "bg-green-400" : "bg-gray-200")} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
