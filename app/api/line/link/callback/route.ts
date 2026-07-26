import { NextRequest, NextResponse } from "next/server"
import { consumeLineLinkToken } from "@/lib/integrations/line/link-token"

export const runtime = "nodejs"

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token"
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify"

// The patient/family sees this page in whatever browser LINE handed the redirect
// to, so it has to stand on its own — no app shell, no session.
function resultPage(heading: string, detail: string, ok: boolean): NextResponse {
  const color = ok ? "#16a34a" : "#dc2626"
  const html = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>เชื่อมต่อ LINE</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 20vh 1.5rem 0; color: #111827;">
    <h1 style="font-size: 1.5rem; color: ${color};">${heading}</h1>
    <p style="color: #4b5563; line-height: 1.7;">${detail}</p>
  </body>
</html>`
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  })
}

const FAILURE_DETAIL = "กรุณาแจ้งเจ้าหน้าที่เพื่อสแกน QR อีกครั้ง"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // The user declined the consent screen, or LINE rejected the request.
  if (params.get("error")) {
    return resultPage("ยังไม่ได้เชื่อมต่อ LINE", FAILURE_DETAIL, false)
  }

  const code = params.get("code")
  // link/start sends the same value as both state and nonce, so it doubles as the
  // link-token lookup key. Checking it against the id_token's nonce below is what
  // stops a replayed or forged callback from binding the wrong LINE account.
  const state = params.get("state")
  if (!code || !state) {
    return resultPage("ลิงก์ไม่ถูกต้อง", FAILURE_DETAIL, false)
  }

  const clientId = process.env.LINE_LOGIN_CHANNEL_ID
  const clientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET
  if (!clientId || !clientSecret) {
    console.error("[LINE link] LINE_LOGIN_CHANNEL_ID/SECRET not set")
    return resultPage("ระบบยังไม่พร้อมใช้งาน", FAILURE_DETAIL, false)
  }

  // Must match the redirect_uri sent to /authorize byte for byte or LINE rejects the
  // exchange — hence the same NEXT_PUBLIC_APP_URL precedence as link/start.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || request.nextUrl.origin
  const redirectUri = new URL("/api/line/link/callback", baseUrl).toString()

  let idToken: string
  try {
    const tokenRes = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    if (!tokenRes.ok) {
      // The body carries LINE's error code (invalid_grant, redirect_uri mismatch, ...)
      // and no user data, so it is safe to log.
      console.error(`[LINE link] token exchange ${tokenRes.status}: ${await tokenRes.text()}`)
      return resultPage("เชื่อมต่อ LINE ไม่สำเร็จ", FAILURE_DETAIL, false)
    }
    const tokenJson = (await tokenRes.json()) as { id_token?: string }
    if (!tokenJson.id_token) {
      console.error("[LINE link] token response has no id_token (scope=openid missing?)")
      return resultPage("เชื่อมต่อ LINE ไม่สำเร็จ", FAILURE_DETAIL, false)
    }
    idToken = tokenJson.id_token
  } catch (error) {
    console.error("[LINE link] token exchange failed:", error instanceof Error ? error.message : error)
    return resultPage("เชื่อมต่อ LINE ไม่สำเร็จ", FAILURE_DETAIL, false)
  }

  // Let LINE verify the id_token: signature, issuer, audience, expiry, and — because
  // the nonce is passed — that this token belongs to the authorize call we started.
  let lineUserId: string
  try {
    const verifyRes = await fetch(LINE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, client_id: clientId, nonce: state }),
    })
    if (!verifyRes.ok) {
      console.error(`[LINE link] id_token verify ${verifyRes.status}: ${await verifyRes.text()}`)
      return resultPage("เชื่อมต่อ LINE ไม่สำเร็จ", FAILURE_DETAIL, false)
    }
    const claims = (await verifyRes.json()) as { sub?: string }
    if (!claims.sub) {
      console.error("[LINE link] verified id_token has no sub")
      return resultPage("เชื่อมต่อ LINE ไม่สำเร็จ", FAILURE_DETAIL, false)
    }
    lineUserId = claims.sub
  } catch (error) {
    console.error("[LINE link] id_token verify failed:", error instanceof Error ? error.message : error)
    return resultPage("เชื่อมต่อ LINE ไม่สำเร็จ", FAILURE_DETAIL, false)
  }

  // Single-use and TTL-checked inside; also writes Patient.lineUserId + lineLinkedAt.
  const linked = await consumeLineLinkToken(state, lineUserId)
  if (!linked) {
    return resultPage("ลิงก์หมดอายุแล้ว", "กรุณาแจ้งเจ้าหน้าที่เพื่อสร้าง QR ใหม่", false)
  }

  return resultPage(
    "เชื่อมต่อ LINE สำเร็จ",
    "ท่านจะได้รับการแจ้งเตือนเกี่ยวกับการยืมอุปกรณ์ผ่าน LINE<br />ปิดหน้านี้ได้เลย",
    true,
  )
}
