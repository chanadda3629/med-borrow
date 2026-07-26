import { Suspense } from "react"
import { WORKFLOW_DISPLAY_STEPS } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { FloatingActionButton } from "@/components/shared/FloatingActionButton"
import { Skeleton } from "@/components/ui/skeleton"
import { FilterBarSkeleton, RequestRowsSkeleton } from "@/components/skeletons/page-skeletons"
import { RequestsFilters } from "./_components/RequestsFilters"
import { RequestsList, type RequestsListParams } from "./_components/RequestsList"

interface PageProps {
  searchParams: Promise<RequestsListParams>
}

/**
 * Not async on purpose: the page must not await `searchParams`, or the whole
 * route blocks on the database before a single byte is sent. The static shell
 * (header, filters, FAB, tab bar) renders immediately and the promise is handed
 * to <RequestsList/> behind a Suspense boundary, which streams in after.
 */
export default function RequestsPage({ searchParams }: PageProps) {
  return (
    <div>
      <PageHeader title="คำร้อง" />

      <div className="space-y-4 p-4 pb-24">
        {/* useSearchParams() needs a boundary of its own so it never opts the
            surrounding tree out of static/streaming rendering. */}
        <Suspense fallback={<FilterBarSkeleton chips={7} />}>
          <RequestsFilters workflowStatuses={WORKFLOW_DISPLAY_STEPS.map((s) => s.label)} />
        </Suspense>

        <Suspense fallback={<RequestsListFallback />}>
          <RequestsList searchParams={searchParams} />
        </Suspense>
      </div>

      <FloatingActionButton href="/requests/new" label="เพิ่มคำร้อง" />
    </div>
  )
}

function RequestsListFallback() {
  return (
    <>
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <RequestRowsSkeleton rows={6} />
    </>
  )
}
