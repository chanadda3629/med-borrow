"use client"
import { useState } from "react"
import { Search, X, SlidersHorizontal, ChevronDown, Loader2 } from "lucide-react"
import { useFilterParams } from "@/lib/hooks/use-filter-params"
import { cn } from "@/lib/utils"

interface InventoryFiltersProps {
  equipmentTypes: string[]
  equipmentStatuses: string[]
}

export function InventoryFilters({
  equipmentTypes,
  equipmentStatuses,
}: InventoryFiltersProps) {
  const { get, query, setSearch, clearSearch, setParam, toggleParam, pending } =
    useFilterParams("/inventory")

  const currentType = get("type")
  const currentStatus = get("status")
  const currentSort = get("sort")
  const [showTypes, setShowTypes] = useState(Boolean(currentType))

  return (
    <div className="space-y-3">
      {/* Search pill */}
      <div className="flex items-center gap-2">
        <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 transition-all duration-150 focus-within:border-accent-500 focus-within:ring-[3px] focus-within:ring-accent-500/15">
          {pending ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent-500" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-faint" />
          )}
          <input
            value={query}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาหมายเลขครุภัณฑ์..."
            className="w-full bg-transparent text-base text-foreground placeholder:text-faint focus:outline-none"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="ล้างคำค้นหา"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-all duration-150 ease-apple hover:bg-hairline active:scale-[0.97]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setShowTypes((s) => !s)}
          aria-label="ตัวกรองประเภท"
          className={cn(
            "flex h-9 shrink-0 items-center justify-center rounded-full px-3 transition-all duration-150 ease-apple active:scale-[0.97]",
            showTypes || currentType
              ? "bg-accent-500 text-white"
              : "bg-hairline text-foreground hover:bg-border",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={currentSort === "asc" ? "asc" : "desc"}
            onChange={(e) => setParam("sort", e.target.value === "asc" ? "asc" : "")}
            aria-label="เรียงลำดับ"
            className="h-9 appearance-none rounded-full bg-hairline pl-4 pr-8 text-sm font-medium text-foreground transition-all duration-150 hover:bg-border focus:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
          >
            <option value="desc">ใหม่สุด</option>
            <option value="asc">เก่าสุด</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>

        {/* Status chips */}
        {equipmentStatuses.map((s) => {
          const active = currentStatus === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleParam("status", s)}
              className={cn(
                "h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-all duration-150 ease-apple active:scale-[0.97]",
                active
                  ? "bg-accent-500 text-white"
                  : "bg-hairline text-foreground hover:bg-border",
              )}
            >
              {s}
            </button>
          )
        })}
      </div>

      {/* Type filter (toggled by sliders) */}
      {showTypes && (
        <div className="flex flex-wrap gap-2">
          {equipmentTypes.map((t) => {
            const active = currentType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleParam("type", t)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs font-medium transition-all duration-150 ease-apple active:scale-[0.97]",
                  active
                    ? "bg-accent-50 text-accent-700 ring-1 ring-accent-200"
                    : "bg-hairline text-muted hover:bg-border",
                )}
              >
                {t}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
