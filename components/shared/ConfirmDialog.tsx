"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Center confirmation dialog — DESIGN.md §8 (short confirmations only). Glass
// backdrop with 4px blur; opaque card.
interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  trigger, title, description,
  confirmLabel = "ยืนยัน", cancelLabel = "ยกเลิก",
  onConfirm, variant = "default",
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try { await onConfirm() } finally { setLoading(false); setOpen(false) }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-[overlay-in_0.15s_ease-out]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]" onClick={() => setOpen(false)} />
          <div className="relative mx-4 w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl animate-[pop-in_0.2s_var(--ease-apple)]">
            <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
            <p className="mb-6 text-sm text-muted">{description}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOpen(false)}
                className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hairline active:scale-[0.97]">
                {cancelLabel}
              </button>
              <button onClick={handleConfirm} disabled={loading}
                className={cn("rounded-md px-4 py-2 text-sm font-medium text-white transition-all active:scale-[0.97] disabled:opacity-50",
                  variant === "destructive" ? "bg-danger hover:brightness-95" : "bg-accent-500 hover:bg-accent-600")}>
                {loading ? "กำลังดำเนินการ..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
