"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// Glass top bar — DESIGN.md §8. Floating layer, so it uses the glass recipe with
// a bottom hairline. Text/icons stay foreground/muted for AA contrast on glass.
interface PageHeaderProps {
  title: string
  showBack?: boolean
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, showBack, actions, className }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header
      className={cn(
        "glass sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-black/[0.06] px-4",
        className,
      )}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          aria-label="ย้อนกลับ"
          className="-ml-1 rounded-md p-1 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold text-foreground">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
