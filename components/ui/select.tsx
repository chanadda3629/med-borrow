import { cn } from "@/lib/utils"
import { type SelectHTMLAttributes, forwardRef } from "react"

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref}
      className={cn("w-full h-12 px-3 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-60 appearance-none", className)}
      {...props} />
  )
)
Select.displayName = "Select"
