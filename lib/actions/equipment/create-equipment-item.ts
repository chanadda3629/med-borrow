"use server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"

interface CreateItemInput {
  equipmentCode: string
  assetNumber: string
  equipmentType: string
  donorName?: string
  receivedDate: string
  condition?: string
}

export async function createEquipmentItem(input: CreateItemInput) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const donorName = input.donorName?.trim()
    const condition = input.condition === "ชำรุด" ? "ชำรุด" : "ดี"
    const item = await db.equipmentItem.create({
      data: {
        equipmentId: "EQ-" + Date.now(),
        equipmentCode: input.equipmentCode,
        assetNumber: input.assetNumber,
        equipmentType: input.equipmentType,
        donorName: donorName ? donorName : null,
        receivedDate: new Date(input.receivedDate),
        currentStatus: "พร้อมใช้งาน",
        condition,
      },
    })
    return ok({ itemId: item.id })
  } catch (e) {
    return err(e instanceof Error ? e.message : "ไม่สามารถบันทึกได้")
  }
}
