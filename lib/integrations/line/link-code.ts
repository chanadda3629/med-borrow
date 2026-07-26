// Account linking, code-based.
//
// Staff mint a short code in /reports and read it to the patient. The patient
// types it into the LINE chat, and the webhook binds `event.source.userId` to the
// patient record. The userId therefore arrives on the *same* channel that later
// pushes to it, so it is correct by construction — unlike the LINE Login flow,
// where the id_token `sub` is only a valid push target if the Login channel and
// the Messaging API channel happen to share a provider.
import { randomInt } from "crypto"
import { db } from "@/lib/db"

const CODE_TTL_MS = 30 * 60 * 1000
const CODE_LENGTH = 6
// No 0/O and no 1/I/L — the code gets read aloud to elderly patients.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

// The webhook uses this to decide whether an inbound text is a link attempt or an
// ordinary message for staff. Anchored, so only an exact-length code matches.
export const LINK_CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`)

export type LinkFailureReason = "invalid" | "expired" | "locked"

export type LinkOutcome =
  | { ok: true; patientName: string; transferred: boolean }
  | { ok: false; reason: LinkFailureReason }

function generateCode(): string {
  let code = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return code
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002"
}

// One live code per patient: minting again replaces the previous one, so a code
// read out by mistake stops working as soon as staff generate a new one.
export async function createLineLinkCode(patientId: string): Promise<{ code: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    try {
      await db.lineLinkToken.upsert({
        where: { patientId },
        create: { patientId, code, expiresAt },
        update: { code, expiresAt, consumedAt: null },
      })
      return { code, expiresAt }
    } catch (error) {
      // Another patient already holds this code — draw again. Anything else is real.
      if (!isUniqueViolation(error)) throw error
    }
  }

  throw new Error("ไม่สามารถสร้างรหัสได้ กรุณาลองใหม่")
}

async function isLockedOut(lineUserId: string): Promise<boolean> {
  const record = await db.lineLinkAttempt.findUnique({ where: { lineUserId } })
  return !!record?.lockedUntil && record.lockedUntil > new Date()
}

async function registerFailure(lineUserId: string): Promise<void> {
  const record = await db.lineLinkAttempt.upsert({
    where: { lineUserId },
    create: { lineUserId, failedCount: 1 },
    update: { failedCount: { increment: 1 } },
  })
  if (record.failedCount >= MAX_FAILED_ATTEMPTS) {
    await db.lineLinkAttempt.update({
      where: { lineUserId },
      data: { failedCount: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
    })
  }
}

async function clearFailures(lineUserId: string): Promise<void> {
  await db.lineLinkAttempt.deleteMany({ where: { lineUserId } })
}

export async function consumeLineLinkCode(rawCode: string, lineUserId: string): Promise<LinkOutcome> {
  if (await isLockedOut(lineUserId)) return { ok: false, reason: "locked" }

  const code = rawCode.trim().toUpperCase()
  const token = await db.lineLinkToken.findUnique({
    where: { code },
    include: { patient: { select: { id: true, fullName: true } } },
  })

  // A wrong or already-spent code is a guess; an expired one was genuinely issued,
  // so it does not count against the lockout.
  if (!token || token.consumedAt) {
    await registerFailure(lineUserId)
    return { ok: false, reason: "invalid" }
  }
  if (token.expiresAt < new Date()) {
    return { ok: false, reason: "expired" }
  }

  // Patient.lineUserId is @unique, so one LINE account follows one patient. If this
  // account is already bound elsewhere, move it — the holder proved they have a
  // current staff-issued code for the new patient — and say so in the reply.
  const previous = await db.patient.findUnique({ where: { lineUserId }, select: { id: true } })
  const transferred = !!previous && previous.id !== token.patientId

  const operations = []
  if (transferred) {
    operations.push(
      db.patient.update({ where: { id: previous.id }, data: { lineUserId: null, lineLinkedAt: null } }),
    )
  }
  operations.push(db.lineLinkToken.update({ where: { code }, data: { consumedAt: new Date() } }))
  operations.push(
    db.patient.update({
      where: { id: token.patientId },
      data: { lineUserId, lineLinkedAt: new Date() },
    }),
  )

  // Sequential inside one transaction: the old binding must be released before the
  // new one is written or the unique index rejects it.
  await db.$transaction(operations)
  await clearFailures(lineUserId)

  return { ok: true, patientName: token.patient.fullName, transferred }
}

// ออกจากระบบ — the patient's own opt-out, and the recovery path when a code was
// read to the wrong person or a phone changes hands.
export async function unlinkLineUser(lineUserId: string): Promise<boolean> {
  const result = await db.patient.updateMany({
    where: { lineUserId },
    data: { lineUserId: null, lineLinkedAt: null },
  })
  return result.count > 0
}
