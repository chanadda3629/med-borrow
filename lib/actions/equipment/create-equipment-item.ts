"use server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { yearFromDateString } from "@/lib/domain/equipment-code"
import { nextEquipmentCode } from "@/lib/actions/equipment/next-equipment-code"

// Unique-constraint violation (equipmentCode/assetNumber already taken).
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  )
}

interface CreateItemInput {
  equipmentType: string
  donorName?: string
  receivedDate: string
  condition?: string
}

// Code is derived from (type, year) via a max+1 count, so two near-simultaneous
// inserts can race onto the same running number. The unique constraint catches
// it (P2002); we recompute and retry a few times before giving up.
const MAX_ATTEMPTS = 5

export async function createEquipmentItem(input: CreateItemInput) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const year = yearFromDateString(input.receivedDate)
    if (!year) return err("วันที่ไม่ถูกต้อง")

    const donorName = input.donorName?.trim()
    const condition = input.condition === "ชำรุด" ? "ชำรุด" : "ดี"

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = await nextEquipmentCode(input.equipmentType, year)
      if (!code) return err("ไม่รองรับประเภทอุปกรณ์นี้")

      try {
        const item = await db.equipmentItem.create({
          data: {
            equipmentId: "EQ-" + Date.now(),
            // Asset number (หมายเลขครุภัณฑ์) mirrors the auto-generated code.
            equipmentCode: code,
            assetNumber: code,
            equipmentType: input.equipmentType,
            donorName: donorName ? donorName : null,
            receivedDate: new Date(input.receivedDate),
            currentStatus: "พร้อมใช้งาน",
            condition,
          },
        })
        return ok({ itemId: item.id })
      } catch (e) {
        // Unique collision on a raced running number — recompute and retry.
        if (isUniqueViolation(e) && attempt < MAX_ATTEMPTS - 1) {
          continue
        }
        throw e
      }
    }

    return err("ไม่สามารถสร้างรหัสอุปกรณ์ได้ กรุณาลองใหม่")
  } catch (e) {
    return err(e instanceof Error ? e.message : "ไม่สามารถบันทึกได้")
  }
}
