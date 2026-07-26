import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonScreen } from "@/components/ui/skeleton"
import { FormSkeleton } from "@/components/skeletons/page-skeletons"

export default function NewInventoryLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="เพิ่มอุปกรณ์ใหม่" showBack />
      <div className="p-4 pb-24">
        <FormSkeleton fields={6} />
      </div>
    </SkeletonScreen>
  )
}
