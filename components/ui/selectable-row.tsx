import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface SelectableRowProps {
  selected: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  role?: "radio" | "checkbox"
}

export function SelectableRow({
  selected,
  disabled,
  onClick,
  children,
  className,
  role = "checkbox",
}: SelectableRowProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-md border px-4 py-3.5 text-left text-sm transition-all duration-150 active:scale-[0.98]",
        selected
          ? "border-accent-200 bg-accent-50 text-accent-700 font-medium"
          : "border-border bg-surface text-foreground hover:bg-hairline",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          selected ? "bg-accent-500 scale-100" : "bg-hairline scale-90"
        )}
      >
        {selected && (
          <Check className="h-3.5 w-3.5 text-white animate-[pop-in_0.28s_var(--ease-apple)]" />
        )}
      </span>
    </button>
  )
}
