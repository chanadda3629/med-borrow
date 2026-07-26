import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { QuickActionsGrid } from "./_components/QuickActionsGrid"
import {
  DashboardHeaderSection,
  ActionQueueSection,
  DueSoonSection,
  InventoryStatusSection,
} from "./_components/sections"

/**
 * Every card here is backed by a different query. Giving each its own Suspense
 * boundary means they fan out in parallel and each one paints the moment its own
 * data lands, instead of the whole screen waiting on the slowest of the four.
 * QuickActionsGrid needs no data at all, so it is on screen immediately.
 */
export default function DashboardPage() {
  return (
    <div className="pb-4">
      <Suspense fallback={<HeaderFallback />}>
        <DashboardHeaderSection />
      </Suspense>

      <div className="space-y-6 p-4">
        <QuickActionsGrid />

        <Suspense fallback={<CardListFallback rows={3} />}>
          <ActionQueueSection />
        </Suspense>

        <Suspense fallback={<CardListFallback rows={3} />}>
          <DueSoonSection />
        </Suspense>

        <Suspense fallback={<InventoryStatusFallback />}>
          <InventoryStatusSection />
        </Suspense>
      </div>
    </div>
  )
}

function HeaderFallback() {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-2">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-5 w-36 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
      </div>
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
    </header>
  )
}

function CardListFallback({ rows }: { rows: number }) {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-4 w-28 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
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
  )
}

function InventoryStatusFallback() {
  return (
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
  )
}
