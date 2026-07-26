import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyLineSignature } from "@/lib/integrations/line/line-signature"
import { LINK_CODE_PATTERN, consumeLineLinkCode, unlinkLineUser } from "@/lib/integrations/line/link-code"
import { sendLineReplyMessage } from "@/lib/integrations/line/line-client"
import {
  PULL_ACTIONS,
  PULL_LABELS,
  buildStatusReply,
  buildDueReply,
  buildContactReply,
  buildLinkFailedReply,
  buildLinkSuccessReply,
  buildRegisterReply,
  buildUnlinkDoneReply,
  buildUnlinkedReply,
  buildWelcomeReply,
} from "@/lib/integrations/line/pull-status"

export const runtime = "nodejs"

type LineEvent = {
  type: string
  replyToken?: string
  source?: { userId?: string }
  message?: { type: string; id: string; text?: string }
  postback?: { data: string }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-line-signature")

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 })
  }

  let events: LineEvent[] = []
  try {
    events = JSON.parse(rawBody).events ?? []
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 })
  }

  for (const event of events) {
    try {
      await handleEvent(event)
    } catch (error) {
      console.error("LINE webhook event failed", error)
    }
  }

  return NextResponse.json({ ok: true })
}

type Intent = "status" | "due" | "contact" | "register" | "unlink"

// Map a postback (Rich Menu / quick-reply buttons) or a matching text message
// onto an intent. Text matching supports a Rich Menu configured with text
// actions as well as the user simply typing the label.
function resolveIntent(event: LineEvent): Intent | null {
  if (event.type === "postback" && event.postback?.data) {
    if (event.postback.data === PULL_ACTIONS.status) return "status"
    if (event.postback.data === PULL_ACTIONS.due) return "due"
    if (event.postback.data === PULL_ACTIONS.contact) return "contact"
    if (event.postback.data === PULL_ACTIONS.register) return "register"
    if (event.postback.data === PULL_ACTIONS.unlink) return "unlink"
  }
  if (event.type === "message" && event.message?.type === "text" && event.message.text) {
    const text = event.message.text.trim()
    if (text === PULL_LABELS.status) return "status"
    if (text === PULL_LABELS.due) return "due"
    if (text === PULL_LABELS.contact) return "contact"
    if (text === PULL_LABELS.register) return "register"
    if (text === PULL_LABELS.unlink) return "unlink"
  }
  return null
}

function findLinkedPatient(lineUserId: string) {
  return db.patient.findUnique({
    where: { lineUserId },
    select: { id: true, fullName: true },
  })
}

async function handleEvent(event: LineEvent): Promise<void> {
  const userId = event.source?.userId
  if (!userId) return

  // Friend added — free welcome reply with the quick-reply bar.
  if (event.type === "follow" && event.replyToken) {
    const patient = await findLinkedPatient(userId)
    await sendLineReplyMessage(event.replyToken, buildWelcomeReply(!!patient))
    return
  }

  // Pull model — answer a menu tap with a free reply token.
  const intent = resolveIntent(event)
  if (intent && event.replyToken) {
    await handleIntent(intent, userId, event.replyToken)
    return
  }

  if (event.type === "message" && event.message?.type === "text") {
    const text = event.message.text?.trim() ?? ""

    // A staff-issued link code typed into the chat — this is the entire linking
    // flow. userId comes straight off this webhook, so it is by construction the
    // same ID the Messaging API pushes to.
    if (event.replyToken && LINK_CODE_PATTERN.test(text.toUpperCase())) {
      await handleLinkCode(text, userId, event.replyToken)
      return
    }

    // Free-text message from a linked patient — store it for staff to answer
    // manually in /reports (no auto-reply bot).
    await storeInboundMessage(userId, event.message)
  }
}

async function handleLinkCode(code: string, userId: string, replyToken: string): Promise<void> {
  const outcome = await consumeLineLinkCode(code, userId)
  if (outcome.ok) {
    await sendLineReplyMessage(replyToken, buildLinkSuccessReply(outcome.patientName, outcome.transferred))
    return
  }
  await sendLineReplyMessage(replyToken, buildLinkFailedReply(outcome.reason))
}

async function handleIntent(intent: Intent, userId: string, replyToken: string): Promise<void> {
  // The only action available before linking, so it must not require a patient.
  if (intent === "register") {
    await sendLineReplyMessage(replyToken, buildRegisterReply())
    return
  }

  const patient = await findLinkedPatient(userId)

  // Never leak patient data to an unlinked friend.
  if (!patient) {
    await sendLineReplyMessage(replyToken, buildUnlinkedReply())
    return
  }

  if (intent === "unlink") {
    await unlinkLineUser(userId)
    await sendLineReplyMessage(replyToken, buildUnlinkDoneReply())
    return
  }

  if (intent === "status") {
    await sendLineReplyMessage(replyToken, await buildStatusReply(patient))
    return
  }
  if (intent === "due") {
    await sendLineReplyMessage(replyToken, await buildDueReply(patient))
    return
  }

  // contact — reply the hotline instantly AND log an inbound message so staff see
  // the follow-up request in /reports.
  await db.lineMessage.create({
    data: {
      patientId: patient.id,
      direction: "inbound",
      senderType: "patient",
      body: "[ติดต่อเจ้าหน้าที่] ผู้ป่วยขอให้เจ้าหน้าที่ติดต่อกลับ",
    },
  })
  await sendLineReplyMessage(replyToken, buildContactReply())
}

async function storeInboundMessage(userId: string, message: { id: string; text?: string }): Promise<void> {
  const patient = await db.patient.findUnique({
    where: { lineUserId: userId },
    select: { id: true },
  })
  if (!patient) return

  const existing = await db.lineMessage.findFirst({
    where: { lineMessageId: message.id },
    select: { id: true },
  })
  if (existing) return

  await db.lineMessage.create({
    data: {
      patientId: patient.id,
      direction: "inbound",
      senderType: "patient",
      body: message.text ?? "",
      lineMessageId: message.id,
    },
  })
}
