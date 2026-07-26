import { cn } from "@/lib/utils"

// Soft semantic badges — DESIGN.md §2.3. `default` reads as info (indigo).
const variants = {
  default: "bg-info-soft text-info-text",
  info: "bg-info-soft text-info-text",
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  destructive: "bg-danger-soft text-danger-text",
  accent: "bg-accent-50 text-accent-700",
  secondary: "bg-surface-2 text-muted",
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
