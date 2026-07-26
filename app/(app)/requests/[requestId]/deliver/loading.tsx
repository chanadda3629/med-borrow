import { PageHeader } from "@/components/layout/PageHeader"
import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/page-skeletons"

export default function DeliverLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="เตรียมจัดส่ง" showBack />
      <div className="space-y-4 p-4 pb-24">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </SkeletonScreen>
  )
}
