import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// Primary create action for list screens (DESIGN.md §8). Sits above the tab bar.
interface FloatingActionButtonProps {
  href: string
  label: string
  className?: string
}

export function FloatingActionButton({ href, label, className }: FloatingActionButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-accent-500 text-white shadow-lg transition-all duration-150 ease-apple",
        "hover:bg-accent-600 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/30",
        className,
      )}
    >
      <Plus className="h-6 w-6" strokeWidth={2} />
    </Link>
  )
}
