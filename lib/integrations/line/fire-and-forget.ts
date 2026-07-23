import { waitUntil } from "@vercel/functions"
import { sendLineNotification } from "./notification-service"

type Trigger = Parameters<typeof sendLineNotification>[1]

// Send a LINE notification without blocking the Server Action response. On Vercel,
// a Lambda can freeze the moment it returns — dropping an in-flight fetch to LINE.
// waitUntil() keeps the function alive until the send settles, so nothing is lost.
// Outside a Vercel request context (e.g. local dev) waitUntil throws; we fall back
// to a plain fire-and-forget so the same code path works everywhere.
export function fireAndForgetLineNotification(requestId: string, trigger: Trigger): void {
  const promise = sendLineNotification(requestId, trigger).catch((err) => {
    console.error("[LINE] notification failed:", err instanceof Error ? err.message : err)
  })

  try {
    waitUntil(promise)
  } catch {
    // Not running in a context that supports waitUntil — the promise is already
    // in flight and self-logs on failure, so let it run detached.
  }
}
