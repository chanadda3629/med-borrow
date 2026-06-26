import { PageHeader } from "@/components/layout/PageHeader"
import { PatientIntakeWizard } from "./_components/PatientIntakeWizard"

export default function NewRequestPage() {
  return (
    <div>
      <PageHeader title="เพิ่มคำร้องใหม่" showBack />
      <PatientIntakeWizard />
    </div>
  )
}
