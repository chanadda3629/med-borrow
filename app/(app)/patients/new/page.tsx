import { PageHeader } from "@/components/layout/PageHeader"
import { PatientIntakeWizard } from "./_components/PatientIntakeWizard"

export default function NewPatientPage() {
  return (
    <div>
      <PageHeader title="เพิ่มผู้ป่วยใหม่" showBack />
      <PatientIntakeWizard />
    </div>
  )
}
