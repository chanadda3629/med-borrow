import { cn } from "@/lib/utils"
import { type TextareaHTMLAttributes, forwardRef } from "react"

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-24 px-3.5 py-2.5 rounded-md border border-border bg-surface text-base text-foreground",
        "placeholder:text-faint resize-none transition-all duration-150",
        "focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15",
        "disabled:bg-canvas disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"
