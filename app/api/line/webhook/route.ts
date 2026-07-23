import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyLineSignature } from "@/lib/integrations/line/line-signature"
import { consumeLineLinkToken } from "@/lib/integrations/line/link-token"
import { sendLineReplyMessage } from "@/lib/integrations/line/line-client"
import {
  PULL_ACTIONS,
  PULL_LABELS,
  buildStatusReply,
  buildDueReply,
  buildContactReply,
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
  link?: { nonce: string; result: "ok" | "failed" }
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

type PullIntent = "status" | "due" | "contact"

// Map a postback (Rich Menu / quick-reply buttons) or a matching text message
// onto a pull intent. Text matching supports a Rich Menu configured with text
// actions as well as the user simply typing the label.
function resolvePullIntent(event: LineEvent): PullIntent | null {
  if (event.type === "postback" && event.postback?.data) {
    if (event.postback.data === PULL_ACTIONS.status) return "status"
    if (event.postback.data === PULL_ACTIONS.due) return "due"
    if (event.postback.data === PULL_ACTIONS.contact) return "contact"
  }
  if (event.type === "message" && event.message?.type === "text" && event.message.text) {
    const text = event.message.text.trim()
    if (text === PULL_LABELS.status) return "status"
    if (text === PULL_LABELS.due) return "due"
    if (text === PULL_LABELS.contact) return "contact"
  }
  return null
}

async function handleEvent(event: LineEvent): Promise<void> {
  // Account linking (existing flow): bind the LINE userId to the patient record.
  if (event.type === "accountLink" && event.link && event.source?.userId) {
    if (event.link.result === "ok") {
      await consumeLineLinkToken(event.link.nonce, event.source.userId)
    }
    return
  }

  const userId = event.source?.userId
  if (!userId) return

  // Friend added — free welcome reply with the quick-reply bar.
  if (event.type === "follow" && event.replyToken) {
    await sendLineReplyMessage(event.replyToken, buildWelcomeReply())
    return
  }

  // Pull model — answer a menu tap with a free reply token.
  const intent = resolvePullIntent(event)
  if (intent && event.replyToken) {
    await handlePullIntent(intent, userId, event.replyToken)
    return
  }

  // Free-text message from a linked patient — store it for staff to answer
  // manually in /reports (no auto-reply bot).
  if (event.type === "message" && event.message?.type === "text") {
    await storeInboundMessage(userId, event.message)
  }
}

async function handlePullIntent(intent: PullIntent, userId: string, replyToken: string): Promise<void> {
  const patient = await db.patient.findUnique({
    where: { lineUserId: userId },
    select: { id: true, fullName: true },
  })

  // Never leak patient data to an unlinked friend.
  if (!patient) {
    await sendLineReplyMessage(replyToken, buildUnlinkedReply())
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
