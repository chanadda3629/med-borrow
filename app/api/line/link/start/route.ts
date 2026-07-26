import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createLineLinkToken } from "@/lib/integrations/line/link-token"

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId")
  if (!patientId) {
    return NextResponse.json({ error: "missing patientId" }, { status: 400 })
  }

  const patient = await db.patient.findUnique({ where: { id: patientId }, select: { id: true } })
  if (!patient) {
    return NextResponse.json({ error: "patient not found" }, { status: 404 })
  }

  const clientId = process.env.LINE_LOGIN_CHANNEL_ID
  if (!clientId) {
    return NextResponse.json({ error: "LINE_LOGIN_CHANNEL_ID not set" }, { status: 500 })
  }

  const nonce = await createLineLinkToken(patientId)
  // LINE has to be able to reach the redirect target, and it must match the callback
  // URL registered on the Login channel exactly. In dev the request origin is
  // http://localhost:3000, which LINE cannot call back to — NEXT_PUBLIC_APP_URL wins.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || request.nextUrl.origin
  const redirectUri = new URL("/api/line/link/callback", baseUrl).toString()

  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize")
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("client_id", clientId)
  authorizeUrl.searchParams.set("redirect_uri", redirectUri)
  authorizeUrl.searchParams.set("state", nonce)
  authorizeUrl.searchParams.set("nonce", nonce)
  authorizeUrl.searchParams.set("scope", "openid")
  authorizeUrl.searchParams.set("bot_prompt", "aggressive")

  return NextResponse.redirect(authorizeUrl.toString())
}
