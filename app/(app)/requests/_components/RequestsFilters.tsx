"use client"
import { Search, X, ChevronDown, Loader2 } from "lucide-react"
import { useFilterParams } from "@/lib/hooks/use-filter-params"
import { cn } from "@/lib/utils"

interface RequestsFiltersProps {
  workflowStatuses: string[]
}

export function RequestsFilters({ workflowStatuses }: RequestsFiltersProps) {
  const { get, query, setSearch, clearSearch, setParam, toggleParam, pending } =
    useFilterParams("/requests")

  const currentStatus = get("status")
  const currentSort = get("sort")

  return (
    <div className="space-y-3">
      {/* Search pill */}
      <div className="flex items-center gap-2">
        <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 transition-all duration-150 ease-apple focus-within:border-accent-500 focus-within:ring-[3px] focus-within:ring-accent-500/15">
          {pending ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent-500" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-faint" />
          )}
          <input
            value={query}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ป่วย..."
            className="w-full bg-transparent text-base placeholder:text-faint focus:outline-none"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="ล้างคำค้นหา"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-all duration-150 ease-apple hover:bg-hairline"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={currentSort === "asc" ? "asc" : "desc"}
            onChange={(e) => setParam("sort", e.target.value === "asc" ? "asc" : "")}
            aria-label="เรียงลำดับ"
            className="h-9 appearance-none rounded-full border border-border bg-surface pl-4 pr-8 text-sm font-medium text-muted transition-all duration-150 ease-apple hover:bg-hairline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15"
          >
            <option value="desc">ใหม่สุด</option>
            <option value="asc">เก่าสุด</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>

        {/* Status chips */}
        {workflowStatuses.map((s) => {
          const active = currentStatus === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleParam("status", s)}
              className={cn(
                "h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-all duration-150 ease-apple active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-500/15",
                active
                  ? "border-accent-500 bg-accent-500 text-white"
                  : "border-border bg-surface text-muted hover:bg-hairline",
              )}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}
