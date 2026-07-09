"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { sendLineNotification, type Trigger } from "@/lib/integrations/line/notification-service"

export async function sendQuickReply(requestId: string, trigger: Trigger, dueOrReturnDate?: Date) {
  try {
    if (dueOrReturnDate) {
      await db.borrowingRequest.update({ where: { id: requestId }, data: { dueOrReturnDate } })
    }
    const delivered = await sendLineNotification(requestId, trigger)
    revalidatePath("/reports")
    return delivered ? ok(undefined) : err("ยังไม่ได้เชื่อมต่อ LINE")
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
