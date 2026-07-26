import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"

// Variant map — see DESIGN.md §8. `default` = primary (one per screen),
// `secondary`/`outline` = outlined neutral, `ghost`/`tertiary` = text-only,
// `destructive` = danger. Legacy keys kept as aliases so existing call sites work.
const variants = {
  default: "bg-accent-500 text-white shadow-sm hover:bg-accent-600 active:bg-accent-700",
  primary: "bg-accent-500 text-white shadow-sm hover:bg-accent-600 active:bg-accent-700",
  secondary: "bg-surface text-foreground border border-border hover:bg-hairline",
  outline: "bg-surface text-foreground border border-border hover:bg-hairline",
  tertiary: "text-accent-600 hover:bg-accent-50",
  ghost: "text-muted hover:bg-hairline",
  destructive: "bg-danger text-white hover:brightness-95 active:brightness-90",
}

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-6 text-lg",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 ease-apple",
        "active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15 focus-visible:border-accent-500",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = "Button"
