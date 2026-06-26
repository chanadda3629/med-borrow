"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useRef } from "react"
import { Search, X } from "lucide-react"

interface InventoryFiltersProps {
  equipmentTypes: string[]
  equipmentStatuses: string[]
  currentType?: string
  currentStatus?: string
  currentQ?: string
}

export function InventoryFilters({
  equipmentTypes,
  equipmentStatuses,
  currentType,
  currentStatus,
  currentQ,
}: InventoryFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/inventory?${params.toString()}`)
    },
    [router, searchParams],
  )

  const handleSearch = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) {
        params.set("q", val)
      } else {
        params.delete("q")
      }
      router.push(`/inventory?${params.toString()}`)
    },
    [router, searchParams],
  )

  const clearSearch = () => {
    if (inputRef.current) inputRef.current.value = ""
    handleSearch("")
  }

  const chipBase =
    "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap"
  const chipActive = "bg-gray-900 text-white border-gray-900"
  const chipInactive = "bg-white text-gray-600 border-gray-200 hover:border-gray-400"

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative flex items-center mx-4">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="ค้นหาหมายเลขครุภัณฑ์..."
          defaultValue={currentQ ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 rounded-full border border-gray-200 bg-white text-sm outline-none focus:border-gray-400 focus:ring-0"
        />
        {currentQ && (
          <button
            onClick={clearSearch}
            className="absolute right-3 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        <button
          onClick={() => updateParam("type", "all")}
          className={`${chipBase} ${!currentType ? chipActive : chipInactive}`}
        >
          ทุกประเภท
        </button>
        {equipmentTypes.map((t) => (
          <button
            key={t}
            onClick={() => updateParam("type", t)}
            className={`${chipBase} ${currentType === t ? chipActive : chipInactive}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        <button
          onClick={() => updateParam("status", "all")}
          className={`${chipBase} ${!currentStatus ? chipActive : chipInactive}`}
        >
          ทุกสถานะ
        </button>
        {equipmentStatuses.map((s) => (
          <button
            key={s}
            onClick={() => updateParam("status", s)}
            className={`${chipBase} ${currentStatus === s ? chipActive : chipInactive}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
