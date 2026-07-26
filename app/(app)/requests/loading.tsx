import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonScreen, Skeleton } from "@/components/ui/skeleton"
import { FilterBarSkeleton, RequestRowsSkeleton } from "@/components/skeletons/page-skeletons"

export default function RequestsLoading() {
  return (
    <SkeletonScreen>
      {/* Header carries no data — render the real one so it never flickers. */}
      <PageHeader title="คำร้อง" />
      <div className="space-y-4 p-4 pb-24">
        <FilterBarSkeleton chips={7} />
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <RequestRowsSkeleton rows={6} />
      </div>
    </SkeletonScreen>
  )
}
