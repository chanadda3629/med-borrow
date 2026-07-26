import { PageHeader } from "@/components/layout/PageHeader"
import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/page-skeletons"

export default function RequestDetailLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="รายละเอียดคำร้อง" showBack />
      <div className="space-y-4 p-4 pb-24">
        {/* WorkflowStatusStepper */}
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 shrink-0 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-3 h-3.5 w-40 rounded" />
        </div>

        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />

        {/* WorkflowActions */}
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </SkeletonScreen>
  )
}
