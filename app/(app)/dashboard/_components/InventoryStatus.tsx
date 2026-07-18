import Link from "next/link"

export interface InventoryStatusRow {
  type: string
  available: number
  total: number
}

function barColor(ratio: number): string {
  if (ratio <= 0) return "bg-red-500"
  if (ratio <= 0.25) return "bg-amber-500"
  return "bg-emerald-500"
}

export function InventoryStatus({ rows }: { rows: InventoryStatusRow[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">สถานะคลังอุปกรณ์</h2>
        <Link href="/inventory" className="text-xs font-medium text-blue-600">
          ดูทั้งหมด
        </Link>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">ยังไม่มีข้อมูลอุปกรณ์</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => {
              const ratio = row.total > 0 ? row.available / row.total : 0
              return (
                <div key={row.type}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-gray-900">{row.type}</span>
                    <span className="text-gray-500">
                      {row.available} / {row.total} พร้อม
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={"h-full rounded-full " + barColor(ratio)}
                      style={{ width: `${Math.max(ratio * 100, row.available > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
