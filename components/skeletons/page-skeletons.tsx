import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Shared loading shapes. Each one mirrors the box model of the real component
 * it stands in for, so the swap from skeleton to content does not shift layout.
 * Static chrome (PageHeader, BottomTabBar, filter chips) is rendered for real in
 * `loading.tsx` — only data-dependent regions get a skeleton.
 */

/** Search field + horizontally scrolling chip row (RequestsFilters / InventoryFilters). */
export function FilterBarSkeleton({ chips = 6 }: { chips?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: chips }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 shrink-0 rounded-full"
            style={{ width: `${72 + ((i * 29) % 56)}px` }}
          />
        ))}
      </div>
    </div>
  )
}

/** Request list rows: leading icon circle, two text lines, meta line, chevron. */
export function RequestRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 rounded-lg bg-surface p-3.5 shadow-sm"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-44 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <Skeleton className="h-5 w-5 shrink-0 rounded" />
        </div>
      ))}
    </div>
  )
}

/** Generic table body placeholder matching components/ui/table cell padding. */
export function TableSkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-surface shadow-sm">
      <div className="flex gap-4 border-b border-hairline px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-hairline px-4 py-3.5 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1 rounded", c >= cols - 3 && "rounded-full")}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** A card with a title line and N body rows — the detail-page building block. */
export function CardSkeleton({
  lines = 4,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("rounded-lg bg-surface p-4 shadow-sm", className)}>
      <Skeleton className="h-4 w-32 rounded" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton
              className="h-3.5 rounded"
              style={{ width: `${88 + ((i * 37) % 64)}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Stacked detail cards — request detail, equipment detail. */
export function DetailSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} lines={i === 0 ? 5 : 3} />
      ))}
    </div>
  )
}

/** Label + field pairs, then a submit bar — for form routes. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  )
}
