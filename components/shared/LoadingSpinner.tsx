import { cn } from "@/lib/utils"
export function LoadingSpinner({ className }: { className?: string }) {
  return <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-5 h-5", className)} />
}
