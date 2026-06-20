import { requireAdmin } from "@/lib/auth/require-admin"
import { PageHeader } from "@/components/layout/PageHeader"
import { NewEquipmentForm } from "./_components/NewEquipmentForm"
import { EQUIPMENT_TYPES } from "@/lib/domain/constants"

export default async function NewInventoryPage() {
  await requireAdmin()

  return (
    <div>
      <PageHeader title="เพิ่มอุปกรณ์ใหม่" showBack />
      <div className="p-4">
        <NewEquipmentForm equipmentTypes={[...EQUIPMENT_TYPES]} />
      </div>
    </div>
  )
}
