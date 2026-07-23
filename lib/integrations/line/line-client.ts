// Low-level LINE Messaging API client. Two send channels:
//   - push  (POST /v2/bot/message/push)  — billed, staff/system-initiated
//   - reply (POST /v2/bot/message/reply) — FREE, answers an inbound event within
//     ~1 min using its one-time replyToken (the pull model, see line docs)
// Messages are the object shape LINE expects, so callers can attach a quickReply
// bar or richer message types, not just plain text.

const LINE_API = "https://api.line.me/v2/bot/message"

export type LineQuickReplyItem = {
  type: "action"
  action:
    | { type: "message"; label: string; text: string }
    | { type: "postback"; label: string; data: string; displayText?: string }
}

export type LineQuickReply = { items: LineQuickReplyItem[] }

export type LineTextMessage = {
  type: "text"
  text: string
  quickReply?: LineQuickReply
}

// Extend this union as new message types are needed (flex, sticker, ...).
export type LineMessage = LineTextMessage

// Accept a bare string (wrapped as a text message), a single message object, or a
// list of messages (LINE allows up to 5 per call).
function normalizeMessages(input: string | LineMessage | LineMessage[]): LineMessage[] {
  if (typeof input === "string") return [{ type: "text", text: input }]
  return Array.isArray(input) ? input : [input]
}

async function post(endpoint: "push" | "reply", body: Record<string, unknown>): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set")

  const res = await fetch(`${LINE_API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`LINE API ${res.status}: ${await res.text()}`)
}

export async function sendLinePushMessage(
  to: string,
  messages: string | LineMessage | LineMessage[],
): Promise<void> {
  await post("push", { to, messages: normalizeMessages(messages) })
}

// Free reply using the inbound event's one-time replyToken. Must fire within a
// short window of receiving the event, and the token can only be used once.
export async function sendLineReplyMessage(
  replyToken: string,
  messages: string | LineMessage | LineMessage[],
): Promise<void> {
  await post("reply", { replyToken, messages: normalizeMessages(messages) })
}
