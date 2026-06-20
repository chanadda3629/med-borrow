import { sendLineNotification } from "./notification-service"

type Trigger = Parameters<typeof sendLineNotification>[1]

export function fireAndForgetLineNotification(requestId: string, trigger: Trigger): void {
  sendLineNotification(requestId, trigger).catch((err) => {
    console.error("[LINE] notification failed:", err instanceof Error ? err.message : err)
  })
}
