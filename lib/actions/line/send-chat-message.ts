"use server"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { sendLinePushMessage } from "@/lib/integrations/line/line-client"

export async function sendChatMessage(patientId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return err("กรุณากรอกข้อความ")

  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const patient = await db.patient.findUnique({ where: { id: patientId }, select: { lineUserId: true } })
    if (!patient) return err("ไม่พบผู้ป่วย")
    if (!patient.lineUserId) return err("ยังไม่ได้เชื่อมต่อ LINE")

    const staffUserId = session.user.id

    try {
      await sendLinePushMessage(patient.lineUserId, trimmed)
      await db.lineMessage.create({
        data: { patientId, direction: "outbound", senderType: "staff", staffUserId, body: trimmed, deliveryStatus: "sent" },
      })
    } catch (error) {
      await db.lineMessage.create({
        data: { patientId, direction: "outbound", senderType: "staff", staffUserId, body: trimmed, deliveryStatus: "failed" },
      })
      throw error
    }

    revalidatePath("/reports")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
