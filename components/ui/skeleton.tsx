import { cn } from "@/lib/utils"

/**
 * Loading placeholder block. Pair with a route-segment `loading.tsx` or a
 * `<Suspense fallback>` so navigation paints instantly instead of blocking on
 * the server render. Sizing is caller-supplied — a skeleton should occupy the
 * same box as the content it stands in for, or the swap will jump the layout.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  )
}

/** Marks a whole loading view for assistive tech. Children are decorative. */
export function SkeletonScreen({
  label = "กำลังโหลด",
  className,
  children,
}: {
  label?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
