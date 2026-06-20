import { cn } from "@/lib/utils"
import { type InputHTMLAttributes, forwardRef } from "react"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref}
      className={cn("w-full h-12 px-3 border border-gray-300 rounded-lg text-base bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-60", className)}
      {...props} />
  )
)
Input.displayName = "Input"
