"use server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { canTransitionBorrowWorkflowStatus } from "@/lib/domain/transitions"
import { startReturnWaitingSchema } from "@/lib/domain/schemas"
import { toThaiWorkflowStatus } from "@/lib/domain/labels"

interface StartReturnWaitingInput {
  receivedDate: string
  receiverName: string
  delivererName: string
  loanDetail?: string
}

// "รอคืน" stage (transition จัดส่งสำเร็จ → รอคืน): record when the patient received
// the item and the active-loan details, then move the request into the waiting-for-
// return state.
export async function startReturnWaiting(requestId: string, input: StartReturnWaitingInput) {
  try {
    const parsed = startReturnWaitingSchema.safeParse(input)
    if (!parsed.success) return err("กรุณากรอกข้อมูลการยืมให้ครบถ้วน")
    const { receivedDate, receiverName, delivererName, loanDetail } = parsed.data

    const request = await db.borrowingRequest.findUnique({ where: { id: requestId } })
    if (!request) return err("ไม่พบคำร้อง")

    // Normalize legacy English-coded statuses before the transition check.
    const from = toThaiWorkflowStatus(request.workflowStatus)
    if (from !== "จัดส่งสำเร็จ" || !canTransitionBorrowWorkflowStatus(from, "รอคืน")) {
      return err("ไม่สามารถเปลี่ยนเป็นรอคืนในสถานะปัจจุบันได้")
    }

    await db.$transaction([
      db.borrowingRequest.update({
        where: { id: requestId },
        data: {
          workflowStatus: "รอคืน",
          deliveryStatus: "รอคืน",
          receivedDate,
          receiverName,
          delivererName,
          loanDetail: loanDetail || null,
        },
      }),
      db.borrowingRequestStatusHistory.create({
        data: { requestId, fromStatus: from, toStatus: "รอคืน" },
      }),
    ])

    revalidatePath(`/requests/${requestId}`)
    revalidatePath("/requests")
    return ok(undefined)
  } catch (e) {
    return err(e instanceof Error ? e.message : "เกิดข้อผิดพลาด")
  }
}
