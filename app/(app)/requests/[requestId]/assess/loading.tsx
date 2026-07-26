import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonScreen } from "@/components/ui/skeleton"
import { FormSkeleton } from "@/components/skeletons/page-skeletons"

export default function AssessLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="ฟอร์มประเมินและสั่งใช้อุปกรณ์" showBack />
      <div className="p-4 pb-24">
        <FormSkeleton fields={7} />
      </div>
    </SkeletonScreen>
  )
}
