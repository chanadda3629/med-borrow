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
        "w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-all duration-150 active:scale-[0.98]",
        selected
          ? "border-blue-200 bg-blue-50 text-blue-700 font-medium"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          selected ? "bg-blue-600 scale-100" : "bg-gray-100 scale-90"
        )}
      >
        {selected && (
          <Check className="h-3.5 w-3.5 text-white animate-[pop-in_0.28s_cubic-bezier(0.34,1.56,0.64,1)]" />
        )}
      </span>
    </button>
  )
}
