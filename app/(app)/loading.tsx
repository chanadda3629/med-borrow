import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/page-skeletons"

/**
 * Group-level fallback. Segments below define their own tighter skeleton; this
 * one exists so any route added later still gets an instant paint on navigation
 * instead of blocking on the server render.
 */
export default function AppLoading() {
  return (
    <SkeletonScreen className="pb-4">
      <div className="glass sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-black/[0.06] px-4">
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="space-y-4 p-4 pb-24">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
    </SkeletonScreen>
  )
}
