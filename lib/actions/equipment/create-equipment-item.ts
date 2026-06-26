"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"

interface CreateItemInput {
  equipmentCode: string
  assetNumber: string
  equipmentType: string
  receivedDate: string
  donorName?: string
}

export async function createEquipmentItem(input: CreateItemInput) {
  try {
    const donorName = input.donorName?.trim()
    const item = await db.equipmentItem.create({
      data: {
        equipmentId: "EQ-" + Date.now(),
        equipmentCode: input.equipmentCode,
        assetNumber: input.assetNumber,
        equipmentType: input.equipmentType,
        receivedDate: new Date(input.receivedDate),
        donorName: donorName ? donorName : null,
        currentStatus: "พร้อมใช้งาน",
      },
    })
    return ok({ itemId: item.id })
  } catch (e) {
    return err(e instanceof Error ? e.message : "ไม่สามารถบันทึกได้")
  }
}
