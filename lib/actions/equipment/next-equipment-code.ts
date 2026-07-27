import { db } from "@/lib/db"
import {
  equipmentCodePrefix,
  formatEquipmentCode,
} from "@/lib/domain/equipment-code"

/**
 * Compute the next equipment code for a given type + Christian-era year by
 * finding the highest running number already used for that (prefix, year) and
 * adding 1. Using the max (rather than a plain count) keeps numbering stable
 * even if an item was deleted, so a new code never collides with an old one.
 *
 * Server-only: called from the create action and the preview action, never from
 * a client component. Returns null when the type has no known prefix.
 */
export async function nextEquipmentCode(
  equipmentType: string,
  year: number,
): Promise<string | null> {
  const prefix = equipmentCodePrefix(equipmentType)
  if (!prefix) return null

  const codePrefix = `${prefix}-${year}-`
  const existing = await db.equipmentItem.findMany({
    where: { equipmentCode: { startsWith: codePrefix } },
    select: { equipmentCode: true },
  })

  const maxRunning = existing.reduce((max, { equipmentCode }) => {
    const n = Number(equipmentCode.slice(codePrefix.length))
    return Number.isInteger(n) && n > max ? n : max
  }, 0)

  return formatEquipmentCode(prefix, year, maxRunning + 1)
}
