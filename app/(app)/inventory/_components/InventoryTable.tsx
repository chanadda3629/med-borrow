"use client"
import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { formatThaiDate } from "@/lib/utils/format-thai-date"

export interface InventoryRow {
  id: string
  equipmentCode: string
  assetNumber: string
  equipmentType: string
  currentStatus: string
  condition: string
  donorName: string | null
  receivedDate: string
  currentRequestNumber: string | null
}

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [selected, setSelected] = useState<InventoryRow | null>(null)

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
              <th className="px-4 py-3">รหัสครุภัณฑ์</th>
              <th className="px-4 py-3">ชื่ออุปกรณ์</th>
              <th className="px-4 py-3">สถานะอุปกรณ์</th>
              <th className="px-4 py-3">สภาพอุปกรณ์</th>
              <th className="px-4 py-3 text-right">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
              >
                <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                  {row.equipmentCode}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {row.equipmentType}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.currentStatus} type="equipment" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.condition} type="condition" />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    ดูข้อมูล
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ItemDetailModal row={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function ItemDetailModal({
  row,
  onClose,
}: {
  row: InventoryRow
  onClose: () => void
}) {
  const receivedDate = formatThaiDate(new Date(row.receivedDate))

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {row.equipmentType}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="space-y-3">
          <DetailRow label="รหัสครุภัณฑ์" value={row.equipmentCode} />
          <DetailRow label="ชื่ออุปกรณ์" value={row.equipmentType} />
          <DetailRow label="หมายเลขครุภัณฑ์" value={row.assetNumber || "-"} />
          <DetailRow
            label="สถานะอุปกรณ์"
            value={<StatusBadge status={row.currentStatus} type="equipment" />}
          />
          <DetailRow
            label="สภาพอุปกรณ์"
            value={<StatusBadge status={row.condition} type="condition" />}
          />
          <DetailRow label="ผู้บริจาค" value={row.donorName || "-"} />
          <DetailRow label="วันที่รับเข้า" value={receivedDate} />
          <DetailRow label="คำร้องปัจจุบัน" value={row.currentRequestNumber || "-"} />
        </dl>

        <div className="mt-6 flex justify-end">
          <Link
            href={`/inventory/${row.id}`}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ดูประวัติทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
