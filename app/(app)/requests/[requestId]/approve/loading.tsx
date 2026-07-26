import { PageHeader } from "@/components/layout/PageHeader"
import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/page-skeletons"

export default function ApproveLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="อนุมัติคำร้อง" showBack />
      <div className="space-y-4 p-4 pb-24">
        <CardSkeleton lines={4} />

        {/* Availability counters (พร้อมใช้งาน / ทั้งหมด) */}
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="mt-4 flex items-baseline gap-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-7 w-12 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Selectable item rows */}
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </SkeletonScreen>
  )
}
