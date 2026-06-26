export const EQUIPMENT_TYPES = [
  "เตียงผู้ป่วย",
  "รถเข็น",
  "Walker",
  "ไม้เท้า",
  "เครื่องดูดเสมหะ",
  "ถังออกซิเจน",
  "ที่นอนลม",
  "โต๊ะคร่อมเตียง",
  "โถสุขภัณฑ์เคลื่อนที่",
] as const;

export const EQUIPMENT_STATUSES = [
  "พร้อมใช้งาน",
  "ถูกยืม",
  "รอรับคืน",
  "ชำรุด",
  "ซ่อมบำรุง",
] as const;

export const BORROW_WORKFLOW_STATUSES = [
  "รับคำร้อง",
  "ประเมินผู้ป่วย",
  "AI แนะนำอุปกรณ์",
  "ตรวจสอบคลังอุปกรณ์",
  "อนุมัติ",
  "ไม่อนุมัติ",
  "เตรียมจัดส่ง",
  "จัดส่งสำเร็จ",
  "รอคืน",
  "คืนอุปกรณ์",
  "ปิดรายการ",
] as const;

// Per-status text color (flat list / labels). Pill colors live in StatusBadge.
export const WORKFLOW_TEXT_COLORS: Record<string, string> = {
  "รับคำร้อง": "text-blue-600",
  "ประเมินผู้ป่วย": "text-yellow-600",
  "AI แนะนำอุปกรณ์": "text-purple-600",
  "ตรวจสอบคลังอุปกรณ์": "text-orange-600",
  "อนุมัติ": "text-green-600",
  "ไม่อนุมัติ": "text-red-600",
  "เตรียมจัดส่ง": "text-blue-700",
  "จัดส่งสำเร็จ": "text-teal-600",
  "รอคืน": "text-amber-600",
  "คืนอุปกรณ์": "text-lime-600",
  "ปิดรายการ": "text-gray-500",
};

export function workflowTextColor(status: string): string {
  return WORKFLOW_TEXT_COLORS[status] ?? "text-gray-500";
}

export const BORROW_APPROVAL_DECISIONS = ["อนุมัติ", "ไม่อนุมัติ"] as const;

export const DELIVERY_STATUSES = [
  "เตรียมจัดส่ง",
  "จัดส่งสำเร็จ",
  "รอคืน",
  "คืนอุปกรณ์",
] as const;

export const CHECKLIST_OPTIONS = [
  "เดินเองได้",
  "เดินได้โดยใช้ Walker",
  "ใช้รถเข็น",
  "ติดเตียง",
  "ต้องการออกซิเจน",
  "มีแผลกดทับ",
  "ช่วยเหลือตนเองไม่ได้",
] as const;

export const WALKING_ABILITIES = [
  "เดินเองได้",
  "เดินได้โดยใช้ Walker",
  "ใช้รถเข็น",
  "ติดเตียง",
] as const;

export const SELF_CARE_ABILITIES = [
  "ช่วยเหลือตนเองได้",
  "ช่วยเหลือตนเองไม่ได้",
] as const;

export const MEDIA_ASSET_KINDS = [
  "patient-photo",
  "home-environment-photo",
  "assessment-supporting-photo",
  "return-condition-photo",
] as const;

export const CONTACT_CHANNEL_TYPES = ["phone", "line-id"] as const;

export const LINE_NOTIFICATION_DELIVERY_STATUSES = [
  "pending",
  "sent",
  "failed",
] as const;

export const LINE_NOTIFICATION_TRIGGERS = [
  "request-submitted",
  "approved",
  "rejected",
  "preparing-delivery",
  "delivery-completed",
  "return-due-soon",
  "returned",
] as const;

export const RETURN_CONDITIONS = ["ใช้งานได้", "ชำรุด"] as const;

