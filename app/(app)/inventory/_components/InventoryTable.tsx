"use client"
import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
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
      <div className="overflow-hidden rounded-lg bg-surface shadow-sm">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>รหัสครุภัณฑ์</TableHead>
              <TableHead>ชื่ออุปกรณ์</TableHead>
              <TableHead>สถานะอุปกรณ์</TableHead>
              <TableHead>สภาพอุปกรณ์</TableHead>
              <TableHead className="text-right">รายละเอียด</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-sm font-semibold text-accent-600">
                  {row.equipmentCode}
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">
                  {row.equipmentType}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.currentStatus} type="equipment" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.condition} type="condition" />
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="rounded-full bg-accent-50 px-3.5 py-1.5 text-xs font-medium text-accent-700 transition-all duration-150 ease-apple hover:bg-accent-100 active:scale-[0.97]"
                  >
                    ดูข้อมูล
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {row.equipmentType}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint transition-all duration-150 ease-apple hover:bg-hairline active:scale-[0.97]"
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
            className="rounded-md bg-accent-500 px-5 py-2 text-sm font-medium text-white transition-all duration-150 ease-apple hover:bg-accent-600 active:scale-[0.97]"
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
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
