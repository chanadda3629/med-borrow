import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonScreen } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/page-skeletons"

export default function AiLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="คำแนะนำอุปกรณ์จาก AI" showBack />
      <div className="space-y-4 p-4 pb-24">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={5} />
      </div>
    </SkeletonScreen>
  )
}
