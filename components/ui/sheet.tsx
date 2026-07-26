"use client"

import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect, type ReactNode } from "react"

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  className?: string
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[4px] sm:items-center animate-[overlay-in_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          "flex w-full flex-col bg-surface sm:w-[420px] sm:max-h-[85vh] sm:rounded-xl max-h-[90vh] rounded-t-[24px] shadow-xl animate-[sheet-in_0.35s_var(--ease-apple)]",
          className
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-hairline">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-faint hover:bg-hairline hover:text-foreground"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">{children}</div>
      </div>
    </div>
  )
}
