import { PageHeader } from "@/components/layout/PageHeader"
import { SkeletonScreen } from "@/components/ui/skeleton"
import { FilterBarSkeleton, TableSkeleton } from "@/components/skeletons/page-skeletons"

export default function InventoryLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="คลังอุปกรณ์" />
      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 pb-24">
        <FilterBarSkeleton chips={6} />
        <TableSkeleton rows={8} cols={5} />
      </div>
    </SkeletonScreen>
  )
}
