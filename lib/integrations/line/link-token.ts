import { randomBytes } from "crypto"
import { db } from "@/lib/db"

const TOKEN_TTL_MS = 30 * 60 * 1000

export async function createLineLinkToken(patientId: string): Promise<string> {
  const nonce = randomBytes(24).toString("hex")
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  await db.lineLinkToken.upsert({
    where: { patientId },
    create: { patientId, nonce, expiresAt },
    update: { nonce, expiresAt, consumedAt: null },
  })

  return nonce
}

export async function consumeLineLinkToken(nonce: string, lineUserId: string): Promise<boolean> {
  const token = await db.lineLinkToken.findUnique({ where: { nonce } })
  if (!token || token.consumedAt || token.expiresAt < new Date()) return false

  try {
    await db.$transaction([
      db.lineLinkToken.update({ where: { nonce }, data: { consumedAt: new Date() } }),
      db.patient.update({
        where: { id: token.patientId },
        data: { lineUserId, lineLinkedAt: new Date() },
      }),
    ])
    return true
  } catch {
    return false
  }
}
