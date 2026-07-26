"use server"
import { auth } from "@/auth"
import { ok, err } from "@/lib/actions/result"
import { createLineLinkCode } from "@/lib/integrations/line/link-code"

export async function createLinkCode(patientId: string) {
  try {
    const session = await auth()
    if (!session?.user) return err("ไม่ได้รับอนุญาต")

    const { code, expiresAt } = await createLineLinkCode(patientId)
    return ok({ code, expiresAt: expiresAt.toISOString() })
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
