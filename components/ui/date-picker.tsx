"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

const THAI_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

const WHEEL_ITEM_HEIGHT = 40
const WHEEL_VISIBLE_COUNT = 5
const WHEEL_SIDE_COUNT = Math.floor(WHEEL_VISIBLE_COUNT / 2)

interface WheelItem {
  value: number
  label: string
}

function WheelColumn({
  items,
  value,
  onChange,
  className,
}: {
  items: WheelItem[]
  value: number
  onChange: (value: number) => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = selectedIndex * WHEEL_ITEM_HEIGHT
    if (!mountedRef.current) {
      el.scrollTop = target
      mountedRef.current = true
      return
    }
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "smooth" })
    }
  }, [selectedIndex])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleScroll() {
    const el = ref.current
    if (!el) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const nearest = Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)
      const clamped = Math.min(items.length - 1, Math.max(0, nearest))
      el.scrollTo({ top: clamped * WHEEL_ITEM_HEIGHT, behavior: "smooth" })
      const next = items[clamped]?.value
      if (next !== undefined && next !== value) onChange(next)
    }, 120)
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className={cn("no-scrollbar overflow-y-auto", className)}
      style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_COUNT, scrollSnapType: "y mandatory" }}
    >
      <div style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_SIDE_COUNT }} />
      {items.map((item) => (
        <div
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "flex items-center justify-center select-none cursor-pointer transition-all duration-150",
            item.value === value ? "text-foreground font-semibold text-[17px]" : "text-faint text-[15px]"
          )}
          style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: "center" }}
        >
          {item.label}
        </div>
      ))}
      <div style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_SIDE_COUNT }} />
    </div>
  )
}

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
  const [wheelOpen, setWheelOpen] = useState(false)
  const [tempMonth, setTempMonth] = useState(0)
  const [tempYear, setTempYear] = useState(0)
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
    setWheelOpen(false)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (wheelOpen) {
          setWheelOpen(false)
          return
        }
        setOpen(false)
        onBlur?.()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, wheelOpen, onBlur])

  function handleOpenWheel() {
    setTempMonth(viewMonth)
    setTempYear(viewYear)
    setWheelOpen(true)
  }

  function handleConfirmWheel() {
    setViewMonth(tempMonth)
    setViewYear(tempYear)
    setWheelOpen(false)
  }

  const years = useMemo(() => {
    const latest = maxParsed?.year ?? today.year
    const earliest = minParsed?.year ?? latest - 120
    const list: number[] = []
    for (let y = latest; y >= earliest; y--) list.push(y)
    return list
  }, [maxParsed?.year, minParsed?.year, today.year])

  const monthItems = useMemo<WheelItem[]>(
    () => THAI_MONTHS.map((m, i) => ({ value: i, label: m })),
    []
  )
  const yearItems = useMemo<WheelItem[]>(
    () => years.map((y) => ({ value: y, label: String(y + 543) })),
    [years]
  )

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
          "w-full h-11 px-3.5 border rounded-md text-base bg-surface flex items-center gap-2 text-left transition-all duration-150 focus:outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15",
          hasError ? "border-danger" : "border-border",
          !selected && "text-faint"
        )}
      >
        <CalendarDays className="w-4 h-4 text-faint shrink-0" />
        <span className="truncate">{selected ? formatThaiDisplay(selected) : placeholder}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div className="w-full sm:w-[340px] bg-surface rounded-t-[24px] sm:rounded-xl shadow-2xl p-4 pb-6 sm:pb-4 overflow-hidden">
            {wheelOpen ? (
              <div className="flex flex-col">
                <div className="text-center text-sm font-medium text-faint pb-2">
                  เลือกเดือนและปี
                </div>

                <div className="relative">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-md border-y border-accent-100 bg-accent-50/60"
                    style={{ height: WHEEL_ITEM_HEIGHT }}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-surface to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-surface to-transparent" />

                  <div className="relative z-[1] flex">
                    <WheelColumn
                      items={monthItems}
                      value={tempMonth}
                      onChange={setTempMonth}
                      className="flex-[1.4]"
                    />
                    <WheelColumn
                      items={yearItems}
                      value={tempYear}
                      onChange={setTempYear}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setWheelOpen(false)}
                    className="text-sm font-medium text-muted px-3 py-2 rounded-lg hover:bg-canvas hover:text-foreground"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWheel}
                    className="text-sm font-semibold text-accent-600 px-3 py-2 rounded-lg hover:bg-accent-50"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    className="h-9 w-9 flex items-center justify-center rounded-full text-muted hover:bg-hairline"
                    aria-label="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWheel}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-base font-semibold text-foreground hover:bg-hairline active:bg-hairline transition-colors"
                  >
                    {THAI_MONTHS[viewMonth]} {viewYear + 543}
                    <ChevronDown className="w-4 h-4 text-faint" />
                  </button>

                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="h-9 w-9 flex items-center justify-center rounded-full text-muted hover:bg-hairline"
                    aria-label="เดือนถัดไป"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7">
                  {THAI_WEEKDAYS.map((d) => (
                    <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-faint">
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
                            !cell.isCurrentMonth && "text-faint",
                            cell.isCurrentMonth && !disabled && "text-foreground",
                            !disabled && !sel && "hover:bg-hairline",
                            disabled && "text-hairline cursor-not-allowed",
                            isToday && !sel && "ring-1 ring-inset ring-accent-400 text-accent-600 font-semibold",
                            sel && "bg-accent-500 text-white font-semibold"
                          )}
                        >
                          {cell.day}
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-hairline">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm font-medium text-muted px-2 py-1.5 rounded-lg hover:bg-canvas hover:text-foreground"
                  >
                    ล้าง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewYear(today.year)
                      setViewMonth(today.month)
                    }}
                    className="text-sm font-medium text-accent-600 px-2 py-1.5 rounded-lg hover:bg-accent-50"
                  >
                    วันนี้
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
