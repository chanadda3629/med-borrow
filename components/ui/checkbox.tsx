import { cn } from "@/lib/utils"
import { type InputHTMLAttributes, forwardRef } from "react"

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} type="checkbox"
      className={cn("w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer", className)}
      {...props} />
  )
)
Checkbox.displayName = "Checkbox"
