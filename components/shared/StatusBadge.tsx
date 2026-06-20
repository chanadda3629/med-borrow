"use client"
import { cn } from "@/lib/utils"

const WORKFLOW_COLORS: Record<string, string> = {
  "รับคำร้อง": "bg-blue-100 text-blue-700",
  "ประเมินผู้ป่วย": "bg-yellow-100 text-yellow-700",
  "AI แนะนำอุปกรณ์": "bg-purple-100 text-purple-700",
  "ตรวจสอบคลังอุปกรณ์": "bg-orange-100 text-orange-700",
  "อนุมัติ": "bg-green-100 text-green-700",
  "ไม่อนุมัติ": "bg-red-100 text-red-700",
  "เตรียมจัดส่ง": "bg-blue-200 text-blue-800",
  "จัดส่งสำเร็จ": "bg-teal-100 text-teal-700",
  "รอคืน": "bg-amber-100 text-amber-700",
  "คืนอุปกรณ์": "bg-lime-100 text-lime-700",
  "ปิดรายการ": "bg-gray-100 text-gray-600",
}

const EQUIPMENT_COLORS: Record<string, string> = {
  "พร้อมใช้งาน": "bg-green-100 text-green-700",
  "ถูกยืม": "bg-blue-100 text-blue-700",
  "รอรับคืน": "bg-amber-100 text-amber-700",
  "ชำรุด": "bg-red-100 text-red-700",
  "ซ่อมบำรุง": "bg-orange-100 text-orange-700",
}

interface StatusBadgeProps {
  status: string
  type?: "workflow" | "equipment"
  className?: string
}

export function StatusBadge({ status, type = "workflow", className }: StatusBadgeProps) {
  const colorMap = type === "workflow" ? WORKFLOW_COLORS : EQUIPMENT_COLORS
  const color = colorMap[status] ?? "bg-gray-100 text-gray-600"
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", color, className)}>
      {status}
    </span>
  )
}
