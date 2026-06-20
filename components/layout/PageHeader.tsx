"use client"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  showBack?: boolean
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, showBack, actions, className }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className={cn("sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3", className)}>
      {showBack && (
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold text-gray-900 truncate">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
