import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"

/**
 * Mirrors DashboardHeader + QuickActionsGrid + ActionQueue + DueSoonList +
 * InventoryStatus. Every block on the dashboard is data-driven, so the whole
 * page is placeholder — but the tab bar and page frame paint immediately.
 */
export default function DashboardLoading() {
  return (
    <SkeletonScreen className="pb-4">
      {/* DashboardHeader */}
      <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-2">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-3 w-44 rounded" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      </header>

      <div className="space-y-6 p-4">
        {/* QuickActionsGrid — 2 large tiles then 3 small */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>

        {/* ActionQueue */}
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-28 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 rounded-lg bg-surface p-3.5 shadow-sm"
            >
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1 rounded" />
              <Skeleton className="h-6 w-8 rounded" />
            </div>
          ))}
        </div>

        {/* DueSoonList */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-surface p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-3.5 w-44 rounded" />
            </div>
          ))}
        </div>

        {/* InventoryStatus */}
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3.5 w-14 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonScreen>
  )
}
