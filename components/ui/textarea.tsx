import { cn } from "@/lib/utils"
import { type TextareaHTMLAttributes, forwardRef } from "react"

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref}
      className={cn("w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg text-base bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:opacity-60", className)}
      {...props} />
  )
)
Textarea.displayName = "Textarea"
