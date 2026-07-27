// Auto-generated equipment code: [Prefix]-[Year CE]-[Running Number, 3 digits].
// e.g. BED-2026-001. The running number restarts per (prefix, year) and the
// asset number (หมายเลขครุภัณฑ์) mirrors this same value.
//
// Prefixes are keyed by the canonical Thai type labels in constants.ts. Rows may
// be stored as English reference codes (see prisma/seed.mjs); normalize with
// toThaiEquipmentType before looking up a prefix.
import { toThaiEquipmentType } from "@/lib/domain/labels"

export const EQUIPMENT_CODE_PREFIXES: Record<string, string> = {
  "ที่นอนลม": "AM",
  "เตียงผู้ป่วย": "BED",
  "โถสุขภัณฑ์เคลื่อนที่": "CD",
  "ไม้เท้า": "CN",
  "รถเข็น": "WC",
  // Supplied map said O2, but existing inventory uses OX — kept consistent.
  "ถังออกซิเจน": "OX",
  // Types without a prefix in the supplied map — assigned here.
  "Walker": "WK",
  "เครื่องดูดเสมหะ": "SM",
  "โต๊ะคร่อมเตียง": "OT",
}

/**
 * Prefix for an equipment type. Accepts a Thai label or an English reference
 * code. Returns null for unknown types (caller should surface an error rather
 * than mint an ambiguous code).
 */
export function equipmentCodePrefix(equipmentType: string): string | null {
  const thai = toThaiEquipmentType(equipmentType)
  return EQUIPMENT_CODE_PREFIXES[thai] ?? EQUIPMENT_CODE_PREFIXES[equipmentType] ?? null
}

/** Format a running number as at least 3 digits: 1 -> "001", 1234 -> "1234". */
export function formatRunningNumber(n: number): string {
  return String(n).padStart(3, "0")
}

/** Build a full code from its parts. */
export function formatEquipmentCode(prefix: string, year: number, running: number): string {
  return `${prefix}-${year}-${formatRunningNumber(running)}`
}

/** Christian-era (ค.ศ.) year from a "YYYY-MM-DD" date string. */
export function yearFromDateString(date: string): number | null {
  const year = Number(date.slice(0, 4))
  return Number.isInteger(year) && year > 1900 ? year : null
}
