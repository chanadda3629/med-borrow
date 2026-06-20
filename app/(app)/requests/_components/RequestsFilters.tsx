"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Select } from "@/components/ui/select"

interface RequestsFiltersProps {
  workflowStatuses: string[]
  currentStatus?: string
}

export function RequestsFilters({ workflowStatuses, currentStatus }: RequestsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateStatus = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (val && val !== "all") {
        params.set("status", val)
      } else {
        params.delete("status")
      }
      router.push(`/requests?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <Select
      value={currentStatus ?? "all"}
      onChange={(e) => updateStatus(e.target.value)}
      className="w-full sm:w-56"
    >
      <option value="all">ทุกสถานะ</option>
      {workflowStatuses.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  )
}
