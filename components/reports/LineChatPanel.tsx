"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import QRCode from "qrcode"
import { Sheet } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { cn } from "@/lib/utils"
import { sendQuickReply } from "@/lib/actions/line/send-quick-reply"
import { sendChatMessage } from "@/lib/actions/line/send-chat-message"
import { createLinkCode } from "@/lib/actions/line/create-link-code"
import type { Trigger } from "@/lib/integrations/line/notification-service"
import type { ConversationSummary } from "./LineConversationList"

const TRIGGER_LABELS: Record<Trigger, string> = {
  "request-submitted": "แจ้งรับคำร้องแล้ว",
  "approved": "แจ้งอนุมัติ",
  "rejected": "แจ้งไม่อนุมัติ",
  "preparing-delivery": "แจ้งเตรียมจัดส่ง",
  "delivery-completed": "แจ้งจัดส่งสำเร็จ",
  "return-due-soon": "แจ้งใกล้ครบกำหนดคืน",
  "returned": "แจ้งรับคืนแล้ว",
}

const TRIGGERS_NEEDING_DATE = new Set<Trigger>(["preparing-delivery", "delivery-completed", "return-due-soon"])

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

// The Official Account's public add-friend link. Same QR for every patient — it
// only adds the friend; the code below is what identifies which patient.
const OA_ID = process.env.NEXT_PUBLIC_LINE_OA_ID
const ADD_FRIEND_URL = OA_ID ? `https://line.me/R/ti/p/${OA_ID}` : null

function AddFriendQr() {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // Bumped by the retry button to re-run the render. The QR content itself never
  // expires — it is the OA's public add-friend link — so this only recovers from a
  // failed render, not from a stale link.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!ADD_FRIEND_URL) return
    let cancelled = false
    QRCode.toDataURL(ADD_FRIEND_URL, { width: 180, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (!ADD_FRIEND_URL) {
    return <p className="text-xs text-danger">ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LINE_OA_ID</p>
  }
  if (failed) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs text-danger">สร้าง QR ไม่สำเร็จ</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setFailed(false)
            setAttempt((n) => n + 1)
          }}
        >
          ลองใหม่
        </Button>
      </div>
    )
  }
  if (!dataUrl) {
    return <div className="flex h-[180px] w-[180px] items-center justify-center text-sm text-faint">กำลังสร้าง QR...</div>
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR เพิ่มเพื่อน LINE" width={180} height={180} className="rounded-lg" />
}

// Two steps, in order: add the OA as a friend (QR), then type a staff-issued code
// into the chat. The code is what binds this patient to that LINE account.
function LinkSteps({ patientId }: { patientId: string }) {
  const [code, setCode] = useState<{ value: string; expiresAt: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createLinkCode(patientId)
      if (!result.success) setError(result.error)
      else setCode({ value: result.data.code, expiresAt: result.data.expiresAt })
    })
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-muted">ผู้ป่วยยังไม่ได้เชื่อมต่อ LINE</p>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs font-medium text-foreground">1. ให้ผู้ป่วย/ญาติสแกนเพื่อเพิ่มเพื่อน</p>
        <AddFriendQr />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">2. แจ้งรหัสนี้ให้พิมพ์ส่งในแชท LINE</p>
        {code ? (
          <>
            <p className="font-mono text-3xl font-semibold tracking-[0.3em] text-accent-600">{code.value}</p>
            <p className="text-xs text-faint">
              หมดอายุ{" "}
              {new Date(code.expiresAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </p>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleCreate}>
              สร้างรหัสใหม่
            </Button>
          </>
        ) : (
          <Button type="button" disabled={isPending} onClick={handleCreate}>
            สร้างรหัสเชื่อมต่อ
          </Button>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  )
}

interface LineChatPanelProps {
  conversation: ConversationSummary | null
  onClose: () => void
}

export function LineChatPanel({ conversation, onClose }: LineChatPanelProps) {
  const [message, setMessage] = useState("")
  const [pendingDate, setPendingDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [conversation?.timeline.length])

  if (!conversation) return null

  const request = conversation.activeRequest

  function handleSend() {
    if (!conversation) return
    const body = message
    setError(null)
    startTransition(async () => {
      const result = await sendChatMessage(conversation.patientId, body)
      if (!result.success) setError(result.error)
      else setMessage("")
    })
  }

  function handleQuickReply(trigger: Trigger) {
    if (!request) return
    const needsDate = TRIGGERS_NEEDING_DATE.has(trigger)
    const dueDate = needsDate && pendingDate ? new Date(pendingDate) : undefined
    setError(null)
    startTransition(async () => {
      const result = await sendQuickReply(request.id, trigger, dueDate)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <Sheet
      open={!!conversation}
      onClose={onClose}
      className="sm:h-[600px]"
      title={
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{conversation.fullName}</p>
          {request && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <StatusBadge status={request.workflowStatus} />
              {request.dueOrReturnDate && request.daysRemaining !== null && (
                <span>
                  กำหนด {new Date(request.dueOrReturnDate).toLocaleDateString("th-TH")}{" "}
                  {request.daysRemaining < 0
                    ? `(เกินกำหนด ${Math.abs(request.daysRemaining)} วัน)`
                    : request.daysRemaining === 0
                      ? "(ครบกำหนดวันนี้)"
                      : `(อีก ${request.daysRemaining} วัน)`}
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {conversation.timeline.length === 0 && (
            <p className="text-center text-sm text-faint">ยังไม่มีข้อความ</p>
          )}
          {conversation.timeline.map((entry) => (
            <div key={entry.id} className={cn("flex", entry.direction === "outbound" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  entry.direction === "outbound" ? "bg-accent-500 text-white" : "bg-surface-2 text-foreground border border-hairline",
                  entry.deliveryStatus === "failed" && "bg-danger-soft text-danger-text border-transparent"
                )}
              >
                <p className="whitespace-pre-wrap">{entry.body}</p>
                <p className={cn("mt-1 text-[10px]", entry.direction === "outbound" ? "text-accent-100" : "text-faint")}>
                  {formatDateTime(entry.createdAt)}
                  {entry.deliveryStatus === "failed" && " · ส่งไม่สำเร็จ"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="px-4 pb-1 text-xs text-danger">{error}</p>}

        <div className="space-y-2 border-t border-hairline p-3">
          {!conversation.linked ? (
            <LinkSteps patientId={conversation.patientId} />
          ) : (
            <>
              {request && request.availableTriggers.length > 0 && (
                <div className="space-y-2">
                  {request.availableTriggers.some((t) => TRIGGERS_NEEDING_DATE.has(t)) && (
                    <DatePicker value={pendingDate} onChange={setPendingDate} placeholder="วันที่ (ถ้ามี)" />
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {request.availableTriggers.map((trigger) => (
                      <Button
                        key={trigger}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleQuickReply(trigger)}
                      >
                        {TRIGGER_LABELS[trigger]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความ..."
                  className="min-h-[44px]"
                  rows={1}
                />
                <Button type="button" onClick={handleSend} disabled={isPending || !message.trim()}>
                  ส่ง
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Sheet>
  )
}
