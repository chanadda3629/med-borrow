import { cn } from "@/lib/utils"
import { type LabelHTMLAttributes } from "react"

// Label above field — DESIGN.md §8.
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-muted", className)} {...props} />
}
