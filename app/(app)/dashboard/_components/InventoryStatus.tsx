"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { EquipmentIcon } from "./equipment-icons"

export interface InventoryStatusRow {
  type: string
  available: number
  total: number
}

function ratioOf(row: InventoryStatusRow): number {
  return row.total > 0 ? row.available / row.total : 0
}

function barColor(ratio: number): string {
  if (ratio <= 0) return "bg-red-500"
  if (ratio <= 0.25) return "bg-amber-500"
  return "bg-emerald-500"
}

export function InventoryStatus({ rows }: { rows: InventoryStatusRow[] }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  const go = (dir: -1 | 1) => {
    setActive((i) => Math.min(Math.max(i + dir, 0), rows.length - 1))
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">สถานะคลังอุปกรณ์</h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-blue-600"
        >
          ดูทั้งหมด
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-400">ยังไม่มีข้อมูลอุปกรณ์</p>
        </div>
      ) : (
        <>
          {/* Coverflow carousel: neighbours sit behind the centre card on a
              lower layer, dimmed by a milky-white veil. */}
          <div className="relative h-52 select-none overflow-hidden">
            {rows.map((row, i) => {
              const offset = i - active
              const abs = Math.abs(offset)
              if (abs > 2) return null

              const isCenter = offset === 0
              const style: React.CSSProperties = {
                transform: `translateX(-50%) translateX(${offset * 46}%) scale(${
                  isCenter ? 1 : abs === 1 ? 0.86 : 0.72
                })`,
                zIndex: 30 - abs,
                opacity: abs >= 2 ? 0 : 1,
              }

              return (
                <div
                  key={row.type}
                  className="absolute left-1/2 top-1 w-56 transition-all duration-300 ease-out"
                  style={style}
                >
                  <button
                    type="button"
                    onClick={() => (isCenter ? setOpen(true) : setActive(i))}
                    className="block w-full text-left"
                    aria-hidden={!isCenter}
                    tabIndex={isCenter ? 0 : -1}
                  >
                    <InventoryCard row={row} />
                  </button>
                  {/* Milky veil over the non-active cards behind the centre */}
                  {!isCenter && (
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/55" />
                  )}
                </div>
              )
            })}

            {/* Arrows */}
            {active > 0 && (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="ก่อนหน้า"
                className="absolute left-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md backdrop-blur transition-colors hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {active < rows.length - 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="ถัดไป"
                className="absolute right-1 top-1/2 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md backdrop-blur transition-colors hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Dots */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {rows.map((row, i) => (
              <button
                key={row.type}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`ไปที่ ${row.type}`}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === active ? "w-5 bg-blue-600" : "w-1.5 bg-gray-300")
                }
              />
            ))}
          </div>
        </>
      )}

      {open && <InventoryModal rows={rows} onClose={() => setOpen(false)} />}
    </section>
  )
}

function InventoryCard({ row }: { row: InventoryStatusRow }) {
  const ratio = ratioOf(row)
  const ready = row.available > 0

  return (
    <div className="flex h-48 flex-col justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-gray-200/60">
      <div className="flex items-start justify-between gap-2">
        <p className="text-base font-bold leading-snug text-gray-900">{row.type}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <EquipmentIcon type={row.type} className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>

      <div>
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " +
            (ready ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")
          }
        >
          <span
            className={"h-1.5 w-1.5 rounded-full " + (ready ? "bg-emerald-500" : "bg-red-500")}
          />
          {ready ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
        </span>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm text-gray-400">คงเหลือ</span>
          <span className="text-sm font-semibold text-gray-900">
            <span className="text-lg">{row.available}</span>
            <span className="text-gray-400"> / {row.total}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={"h-full rounded-full transition-all " + barColor(ratio)}
            style={{ width: `${Math.max(ratio * 100, row.available > 0 ? 5 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function InventoryModal({
  rows,
  onClose,
}: {
  rows: InventoryStatusRow[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">สถานะคลังอุปกรณ์</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-2 overflow-y-auto p-4">
          {rows.map((row) => {
            const ratio = ratioOf(row)
            const ready = row.available > 0
            return (
              <div
                key={row.type}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                  <EquipmentIcon type={row.type} className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{row.type}</p>
                    <span className="shrink-0 text-sm font-semibold text-gray-900">
                      {row.available}
                      <span className="text-gray-400"> / {row.total}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={"h-full rounded-full " + barColor(ratio)}
                        style={{ width: `${Math.max(ratio * 100, row.available > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                    <span
                      className={
                        "shrink-0 text-[11px] font-medium " +
                        (ready ? "text-emerald-600" : "text-red-600")
                      }
                    >
                      {ready ? "พร้อมใช้งาน" : "ไม่พร้อม"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-gray-100 p-4">
          <Link
            href="/inventory"
            className="flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            ไปที่คลังอุปกรณ์
          </Link>
        </div>
      </div>
    </div>
  )
}
