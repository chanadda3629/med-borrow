import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Skeleton, SkeletonScreen } from "@/components/ui/skeleton"

/**
 * Reports is the heaviest query in the app (inventory groupBy + every patient's
 * notification and LINE-message timeline), so it benefits most from painting the
 * card frame first. Card titles are static — render them for real.
 */
export default function ReportsLoading() {
  return (
    <SkeletonScreen>
      <PageHeader title="รายงาน" />
      <div className="p-4 space-y-6 pb-24">
        <Card>
          <CardHeader><CardTitle>สรุปคลังอุปกรณ์ตามประเภท</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="flex gap-4 border-b border-hairline px-4 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-3.5 flex-1 rounded" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="flex gap-4 border-b border-hairline px-4 py-3">
                {Array.from({ length: 4 }).map((_, c) => (
                  <Skeleton key={c} className="h-4 flex-1 rounded" />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ประวัติการแจ้งเตือน LINE</CardTitle></CardHeader>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 last:border-b-0"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3.5 w-48 rounded" />
                </div>
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SkeletonScreen>
  )
}
