"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        placeholder="ค้นหาหมายเลขครุภัณฑ์..."
        defaultValue={currentQ ?? ""}
        onChange={(e) => {
          const val = e.target.value
          const params = new URLSearchParams(searchParams.toString())
          if (val) {
            params.set("q", val)
          } else {
            params.delete("q")
          }
          router.push(`/inventory?${params.toString()}`)
        }}
        className="flex-1"
      />

      <Select
        value={currentType ?? "all"}
        onChange={(e) => updateParam("type", e.target.value)}
        className="sm:w-48"
      >
        <option value="all">ทุกประเภท</option>
        {equipmentTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>

      <Select
        value={currentStatus ?? "all"}
        onChange={(e) => updateParam("status", e.target.value)}
        className="sm:w-40"
      >
        <option value="all">ทุกสถานะ</option>
        {equipmentStatuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  )
}
