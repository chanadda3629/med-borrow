import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

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
        "fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 active:bg-blue-800",
        className
      )}
    >
      <Plus className="h-6 w-6" />
    </Link>
  )
}
