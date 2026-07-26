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

  // z-[60] keeps the sheet above the fixed BottomTabBar (z-50). At equal z the nav
  // won on DOM order and painted over the sheet footer, hiding its action buttons.
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center animate-[overlay-in_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          "flex w-full flex-col bg-white sm:w-[420px] sm:max-h-[85vh] sm:rounded-3xl max-h-[90vh] rounded-t-3xl shadow-xl animate-[sheet-in_0.32s_cubic-bezier(0.34,1.56,0.64,1)]",
          className
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
