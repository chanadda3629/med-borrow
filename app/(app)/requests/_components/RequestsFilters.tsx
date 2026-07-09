"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RequestsFiltersProps {
  workflowStatuses: string[]
  currentStatus?: string
  currentQ?: string
  currentSort?: string
}

export function RequestsFilters({
  workflowStatuses,
  currentStatus,
  currentQ,
  currentSort,
}: RequestsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(currentQ ?? "")

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/requests?${params.toString()}`)
    },
    [router, searchParams],
  )

  const toggleParam = useCallback(
    (key: string, value: string) => {
      setParam(key, searchParams.get(key) === value ? "all" : value)
    },
    [searchParams, setParam],
  )

  const handleSearch = (val: string) => {
    setQuery(val)
    setParam("q", val)
  }

  const clearSearch = () => {
    setQuery("")
    setParam("q", "")
  }

  return (
    <div className="space-y-3">
      {/* Search pill */}
      <div className="flex items-center gap-2">
        <div className="flex h-12 flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 focus-within:border-transparent focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้ป่วย..."
            className="w-full bg-transparent text-base placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="ล้างคำค้นหา"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
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
            className="h-9 appearance-none rounded-full bg-gray-100 pl-4 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
          >
            <option value="desc">ใหม่สุด</option>
            <option value="asc">เก่าสุด</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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
                "h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-medium",
                active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
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
