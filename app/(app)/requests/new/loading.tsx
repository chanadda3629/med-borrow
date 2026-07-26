import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonScreen } from "@/components/ui/skeleton"
import { FormSkeleton } from "@/components/skeletons/page-skeletons"

/**
 * The page itself is static, but the intake form is a large client bundle
 * (address dataset + date picker). This paints the frame while that chunk loads.
 */
export default function NewRequestLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="เพิ่มคำร้องใหม่" showBack />
      <div className="p-4 pb-24">
        <FormSkeleton fields={8} />
      </div>
    </SkeletonScreen>
  )
}
