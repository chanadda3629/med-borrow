"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

const THAI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

interface ParsedDate {
  year: number
  month: number // 0-11
  day: number
}

interface DayCell extends ParsedDate {
  isCurrentMonth: boolean
}

function parseISODate(value?: string): ParsedDate | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) }
}

function toISODate({ year, month, day }: ParsedDate): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function formatThaiDisplay({ year, month, day }: ParsedDate): string {
  return `${day} ${THAI_MONTHS[month]} ${year + 543}`
}

function sameDate(a: ParsedDate, b: ParsedDate) {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

interface DatePickerProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  max?: string
  min?: string
  placeholder?: string
  hasError?: boolean
}

export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  max,
  min,
  placeholder = "เลือกวันที่",
  hasError,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseISODate(value), [value])
  const today = useMemo(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }
  }, [])
  const maxParsed = useMemo(() => parseISODate(max), [max])
  const minParsed = useMemo(() => parseISODate(min), [min])

  const [viewYear, setViewYear] = useState(selected?.year ?? maxParsed?.year ?? today.year)
  const [viewMonth, setViewMonth] = useState(selected?.month ?? maxParsed?.month ?? today.month)

  function handleToggleOpen() {
    if (open) {
      setOpen(false)
      return
    }
    setViewYear(selected?.year ?? maxParsed?.year ?? today.year)
    setViewMonth(selected?.month ?? maxParsed?.month ?? today.month)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onBlur])

  const years = useMemo(() => {
    const latest = maxParsed?.year ?? today.year
    const earliest = minParsed?.year ?? latest - 120
    const list: number[] = []
    for (let y = latest; y >= earliest; y--) list.push(y)
    return list
  }, [maxParsed?.year, minParsed?.year, today.year])

  const cells = useMemo<DayCell[]>(() => {
    const result: DayCell[] = []
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    for (let i = 0; i < firstWeekday; i++) {
      result.push({ year: prevYear, month: prevMonth, day: daysInPrevMonth - firstWeekday + 1 + i, isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ year: viewYear, month: viewMonth, day: d, isCurrentMonth: true })
    }
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear
    let nextDay = 1
    while (result.length < 42) {
      result.push({ year: nextYear, month: nextMonth, day: nextDay, isCurrentMonth: false })
      nextDay++
    }
    return result
  }, [viewYear, viewMonth])

  function isDisabled(cell: ParsedDate) {
    const iso = toISODate(cell)
    if (max && iso > max) return true
    if (min && iso < min) return true
    return false
  }

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  function handleSelectDay(cell: DayCell) {
    if (isDisabled(cell)) return
    onChange(toISODate(cell))
    setOpen(false)
    onBlur?.()
  }

  function handleClose() {
    setOpen(false)
    onBlur?.()
  }

  function handleClear() {
    onChange("")
    handleClose()
  }

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        onClick={handleToggleOpen}
        className={cn(
          "w-full h-12 px-3 border rounded-lg text-base bg-white flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          hasError ? "border-red-400" : "border-gray-300",
          !selected && "text-gray-400"
        )}
      >
        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="truncate">{selected ? formatThaiDisplay(selected) : placeholder}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div className="w-full sm:w-[340px] bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-4 pb-6 sm:pb-4">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goPrevMonth}
                className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="appearance-none bg-transparent px-1.5 py-1 rounded-md text-base font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {THAI_MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="appearance-none bg-transparent px-1.5 py-1 rounded-md text-base font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y + 543}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={goNextMonth}
                className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                aria-label="เดือนถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7">
              {THAI_WEEKDAYS.map((d) => (
                <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((cell, idx) => {
                const disabled = isDisabled(cell)
                const sel = selected ? sameDate(cell, selected) : false
                const isToday = sameDate(cell, today)
                return (
                  <div key={idx} className="flex items-center justify-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectDay(cell)}
                      className={cn(
                        "h-9 w-9 flex items-center justify-center rounded-full text-sm transition-colors",
                        !cell.isCurrentMonth && "text-gray-300",
                        cell.isCurrentMonth && !disabled && "text-gray-700",
                        !disabled && !sel && "hover:bg-gray-100",
                        disabled && "text-gray-200 cursor-not-allowed",
                        isToday && !sel && "ring-1 ring-inset ring-blue-400 text-blue-600 font-semibold",
                        sel && "bg-blue-600 text-white font-semibold"
                      )}
                    >
                      {cell.day}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-medium text-gray-500 px-2 py-1.5 rounded-lg hover:bg-gray-50 hover:text-gray-700"
              >
                ล้าง
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(today.year)
                  setViewMonth(today.month)
                }}
                className="text-sm font-medium text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-50"
              >
                วันนี้
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
