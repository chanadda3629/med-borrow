import Link from "next/link"
import { getPatients } from "@/lib/actions/patients/get-patients"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const patients = await getPatients(q)

  return (
    <div>
      <PageHeader
        title="รายการผู้ป่วย"
        actions={
          <Link href="/patients/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              เพิ่มใหม่
            </Button>
          </Link>
        }
      />
      <div className="p-4 space-y-4">
        <form method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              name="q"
              defaultValue={q}
              placeholder="ค้นหาชื่อ, เลขบัตร, เบอร์โทร"
              className="w-full h-12 pl-9 pr-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        {patients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่พบข้อมูลผู้ป่วย</div>
        ) : (
          <div className="space-y-2">
            {patients.map((p) => {
              const latest = p.borrowingRequests[0]
              return (
                <Link
                  key={p.id}
                  href={"/patients/" + p.id}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{p.fullName}</p>
                      <p className="text-sm text-gray-500">
                        {p.nationalId} · {p.phoneNumber}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.province} {p.district}
                      </p>
                    </div>
                    {latest && (
                      <StatusBadge status={latest.workflowStatus} type="workflow" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
