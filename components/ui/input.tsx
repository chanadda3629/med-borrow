import { cn } from "@/lib/utils"
import { type InputHTMLAttributes, forwardRef } from "react"

// Outlined input — DESIGN.md §8. 44px touch target, 16px text (prevents mobile
// zoom), global focus ring (accent border + soft ring).
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-3.5 rounded-md border border-border bg-surface text-base text-foreground",
        "placeholder:text-faint transition-all duration-150",
        "focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15",
        "disabled:bg-canvas disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"
