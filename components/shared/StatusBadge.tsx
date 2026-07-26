import { cn } from "@/lib/utils"

// Every status resolves to one semantic role (DESIGN.md §2.4). Single source of
// truth for status color across the app — do not reintroduce ad-hoc tints.
type Role = "success" | "warning" | "danger" | "info" | "neutral"

const ROLE_CLASS: Record<Role, string> = {
  success: "bg-success-soft text-success-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
  info: "bg-info-soft text-info-text",
  neutral: "bg-surface-2 text-muted",
}

const WORKFLOW_ROLE: Record<string, Role> = {
  "รับคำร้อง": "info",
  "ประเมินผู้ป่วย": "info",
  "AI แนะนำอุปกรณ์": "info",
  "ตรวจสอบคลังอุปกรณ์": "info",
  "อนุมัติ": "success",
  "ไม่อนุมัติ": "danger",
  "เตรียมจัดส่ง": "info",
  "จัดส่งสำเร็จ": "success",
  "รอคืน": "warning",
  "คืนอุปกรณ์": "success",
  "ปิดรายการ": "neutral",
}

const EQUIPMENT_ROLE: Record<string, Role> = {
  "พร้อมใช้งาน": "success",
  "ว่าง": "success",
  "รอจัดส่ง": "warning",
  "ถูกยืม": "info",
  "รอรับคืน": "warning",
  "ซ่อมบำรุง": "warning",
  "ชำรุด": "danger",
}

const CONDITION_ROLE: Record<string, Role> = {
  "ดี": "success",
  "ซ่อมบำรุง": "warning",
  "ชำรุด": "danger",
}

const ROLE_MAPS = {
  workflow: WORKFLOW_ROLE,
  equipment: EQUIPMENT_ROLE,
  condition: CONDITION_ROLE,
}

interface StatusBadgeProps {
  status: string
  type?: "workflow" | "equipment" | "condition"
  className?: string
}

export function StatusBadge({ status, type = "workflow", className }: StatusBadgeProps) {
  const role: Role = ROLE_MAPS[type][status] ?? "neutral"
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        ROLE_CLASS[role],
        className,
      )}
    >
      {status}
    </span>
  )
}

// Exported so lists can tint a leading status icon to match its badge role.
export function statusRole(
  status: string,
  type: "workflow" | "equipment" | "condition" = "workflow",
): Role {
  return ROLE_MAPS[type][status] ?? "neutral"
}

export const ROLE_ICON_TINT: Record<Role, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-2 text-muted",
}
