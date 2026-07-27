"use server"
import { auth } from "@/auth"
import { ok, err } from "@/lib/actions/result"
import { yearFromDateString } from "@/lib/domain/equipment-code"
import { nextEquipmentCode } from "@/lib/actions/equipment/next-equipment-code"

/**
 * Preview the code that would be minted for a type + received date, so the form
 * can show it before saving. The value is authoritatively regenerated at create
 * time, so a concurrent insert may bump the running number — this is a preview,
 * not a reservation.
 */
export async function previewEquipmentCode(input: {
  equipmentType: string
  receivedDate: string
}) {
  const session = await auth()
  if (!session?.user) return err("ไม่ได้รับอนุญาต")

  const year = yearFromDateString(input.receivedDate)
  if (!year) return err("วันที่ไม่ถูกต้อง")

  const code = await nextEquipmentCode(input.equipmentType, year)
  if (!code) return err("ไม่รองรับประเภทอุปกรณ์นี้")

  return ok({ code })
}
