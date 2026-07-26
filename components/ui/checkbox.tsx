import { cn } from "@/lib/utils"
import { type InputHTMLAttributes, forwardRef } from "react"

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 cursor-pointer rounded border-border text-accent-500",
        "focus:ring-[3px] focus:ring-accent-500/15",
        className,
      )}
      {...props}
    />
  ),
)
Checkbox.displayName = "Checkbox"
