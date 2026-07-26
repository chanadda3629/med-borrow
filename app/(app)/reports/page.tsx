import { Suspense } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  InventorySummarySection,
  LineConversationsSection,
} from "./_components/sections"

/**
 * Card frames and titles are static, so they render before either query runs.
 * The inventory summary (one groupBy) and the LINE conversation timelines (the
 * heaviest query in the app) stream independently.
 */
export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="รายงาน" />
      <div className="p-4 space-y-6 pb-24">
        <Card>
          <CardHeader><CardTitle>สรุปคลังอุปกรณ์ตามประเภท</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<TableFallback rows={5} cols={4} />}>
              <InventorySummarySection />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ประวัติการแจ้งเตือน LINE</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<ConversationsFallback />}>
              <LineConversationsSection />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TableFallback({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div aria-hidden>
      <div className="flex gap-4 border-b border-hairline px-4 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-hairline px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

function ConversationsFallback() {
  return (
    <div aria-hidden>
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
    </div>
  )
}
