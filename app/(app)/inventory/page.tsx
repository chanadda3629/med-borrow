import { Suspense } from "react"
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "@/lib/domain/constants"
import { PageHeader } from "@/components/layout/PageHeader"
import { FilterBarSkeleton, TableSkeleton } from "@/components/skeletons/page-skeletons"
import { InventoryFilters } from "./_components/InventoryFilters"
import { InventoryList, type InventoryListParams } from "./_components/InventoryList"
import { AddEquipmentButton } from "./_components/AddEquipmentButton"

interface PageProps {
  searchParams: Promise<InventoryListParams>
}

/**
 * Not async on purpose — see the note on /requests. The shell streams first and
 * the table arrives behind its own Suspense boundary.
 */
export default function InventoryPage({ searchParams }: PageProps) {
  return (
    <div>
      <PageHeader
        title="คลังอุปกรณ์"
        actions={
          <Suspense fallback={null}>
            <AddEquipmentButton />
          </Suspense>
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 pb-24">
        <Suspense fallback={<FilterBarSkeleton chips={6} />}>
          <InventoryFilters
            equipmentTypes={[...EQUIPMENT_TYPES]}
            equipmentStatuses={[...EQUIPMENT_STATUSES]}
          />
        </Suspense>

        <Suspense fallback={<TableSkeleton rows={8} cols={5} />}>
          <InventoryList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
