import { ArrowLeft } from "lucide-react"
import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/page-skeletons"

/**
 * The title is the asset number, which is data — so the header bar is rebuilt
 * here with a placeholder title instead of reusing PageHeader. Geometry matches
 * PageHeader exactly (h-14, glass, hairline) so nothing shifts on swap.
 */
export default function InventoryItemLoading() {
  return (
    <SkeletonScreen>
      <header className="glass sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-black/[0.06] px-4">
        <ArrowLeft className="-ml-1 h-5 w-5 p-0 text-faint" strokeWidth={1.75} />
        <Skeleton className="h-4 w-40 rounded" />
      </header>
      <div className="space-y-4 p-4 pb-24">
        <CardSkeleton lines={6} />
        <CardSkeleton lines={4} />
      </div>
    </SkeletonScreen>
  )
}
