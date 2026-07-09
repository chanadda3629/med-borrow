import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyLineSignature } from "@/lib/integrations/line/line-signature"
import { consumeLineLinkToken } from "@/lib/integrations/line/link-token"

export const runtime = "nodejs"

type LineEvent = {
  type: string
  source?: { userId?: string }
  message?: { type: string; id: string; text?: string }
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

async function handleEvent(event: LineEvent): Promise<void> {
  if (event.type === "accountLink" && event.link && event.source?.userId) {
    if (event.link.result === "ok") {
      await consumeLineLinkToken(event.link.nonce, event.source.userId)
    }
    return
  }

  if (event.type === "message" && event.message?.type === "text" && event.source?.userId) {
    const patient = await db.patient.findUnique({
      where: { lineUserId: event.source.userId },
      select: { id: true },
    })
    if (!patient) return

    const existing = await db.lineMessage.findFirst({
      where: { lineMessageId: event.message.id },
      select: { id: true },
    })
    if (existing) return

    await db.lineMessage.create({
      data: {
        patientId: patient.id,
        direction: "inbound",
        senderType: "patient",
        body: event.message.text ?? "",
        lineMessageId: event.message.id,
      },
    })
  }
}
