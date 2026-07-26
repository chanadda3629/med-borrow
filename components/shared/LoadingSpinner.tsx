import { cn } from "@/lib/utils"
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-accent-500/25 border-t-accent-500",
        className,
      )}
    />
  )
}
