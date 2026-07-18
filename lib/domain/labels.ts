// Display-layer resolvers: legacy/external English reference codes -> Thai labels.
//
// The app writes everything in Thai (see constants.ts), but some DB rows were
// seeded elsewhere with the English reference *codes* from prisma/seed.mjs
// (e.g. "received", "wheelchair"). These helpers normalize a stored value for
// display: a known code maps to its Thai label; an already-Thai (or unknown)
// value passes through unchanged. Keep in sync with prisma/seed.mjs.

const EQUIPMENT_TYPE_CODE_TO_TH: Record<string, string> = {
  bed: "เตียงผู้ป่วย",
  wheelchair: "รถเข็น",
  walker: "Walker",
  cane: "ไม้เท้า",
  suction_machine: "เครื่องดูดเสมหะ",
  oxygen_tank: "ถังออกซิเจน",
  air_mattress: "ที่นอนลม",
  overbed_table: "โต๊ะคร่อมเตียง",
  commode: "โถสุขภัณฑ์เคลื่อนที่",
}

const EQUIPMENT_STATUS_CODE_TO_TH: Record<string, string> = {
  available: "พร้อมใช้งาน",
  borrowed: "ถูกยืม",
  awaiting_return: "รอรับคืน",
  damaged: "ชำรุด",
  maintenance: "ซ่อมบำรุง",
}

const WORKFLOW_STATUS_CODE_TO_TH: Record<string, string> = {
  received: "รับคำร้อง",
  assessing_patient: "ประเมินผู้ป่วย",
  ai_recommended: "AI แนะนำอุปกรณ์",
  inventory_check: "ตรวจสอบคลังอุปกรณ์",
  approved: "อนุมัติ",
  rejected: "ไม่อนุมัติ",
  preparing_delivery: "เตรียมจัดส่ง",
  delivered: "จัดส่งสำเร็จ",
  awaiting_return: "รอคืน",
  returned: "คืนอุปกรณ์",
  closed: "ปิดรายการ",
}

export function toThaiEquipmentType(value: string): string {
  return EQUIPMENT_TYPE_CODE_TO_TH[value] ?? value
}

export function toThaiEquipmentStatus(value: string): string {
  return EQUIPMENT_STATUS_CODE_TO_TH[value] ?? value
}

export function toThaiWorkflowStatus(value: string): string {
  return WORKFLOW_STATUS_CODE_TO_TH[value] ?? value
}

// Reverse resolvers: Thai label -> English reference code, for turning a Thai
// filter-chip value back into the code stored in the DB. A value that is already
// a code (or unknown) passes through unchanged.
function invert(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([code, th]) => [th, code]))
}

const EQUIPMENT_TYPE_TH_TO_CODE = invert(EQUIPMENT_TYPE_CODE_TO_TH)
const EQUIPMENT_STATUS_TH_TO_CODE = invert(EQUIPMENT_STATUS_CODE_TO_TH)

export function toEquipmentTypeCode(value: string): string {
  return EQUIPMENT_TYPE_TH_TO_CODE[value] ?? value
}

export function toEquipmentStatusCode(value: string): string {
  return EQUIPMENT_STATUS_TH_TO_CODE[value] ?? value
}
