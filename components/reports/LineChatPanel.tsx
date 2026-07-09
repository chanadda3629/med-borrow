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

function QrConnect({ patientId }: { patientId: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = `${window.location.origin}/api/line/link/start?patientId=${patientId}`
    QRCode.toDataURL(url, { width: 220, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null))
  }, [patientId])

  if (!dataUrl) {
    return (
      <div className="flex h-[220px] w-[220px] items-center justify-center text-sm text-gray-400">
        กำลังสร้าง QR...
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR เชื่อมต่อ LINE" width={220} height={220} className="rounded-lg" />
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
  const [showQr, setShowQr] = useState(false)
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
          <p className="truncate font-semibold text-gray-900">{conversation.fullName}</p>
          {request && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
              <StatusBadge status={request.workflowStatus} />
              {request.dueOrReturnDate && request.daysRemaining !== null && (
                <span>
                  กำหนด {new Date(request.dueOrReturnDate).toLocaleDateString("th-TH")} (อีก {request.daysRemaining} วัน)
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
            <p className="text-center text-sm text-gray-400">ยังไม่มีข้อความ</p>
          )}
          {conversation.timeline.map((entry) => (
            <div key={entry.id} className={cn("flex", entry.direction === "outbound" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  entry.direction === "outbound" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800",
                  entry.deliveryStatus === "failed" && "bg-red-100 text-red-700"
                )}
              >
                <p className="whitespace-pre-wrap">{entry.body}</p>
                <p className={cn("mt-1 text-[10px]", entry.direction === "outbound" ? "text-blue-100" : "text-gray-400")}>
                  {formatDateTime(entry.createdAt)}
                  {entry.deliveryStatus === "failed" && " · ส่งไม่สำเร็จ"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="px-4 pb-1 text-xs text-red-600">{error}</p>}

        <div className="space-y-2 border-t border-gray-100 p-3">
          {!conversation.linked ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-600">ผู้ป่วยยังไม่ได้เชื่อมต่อ LINE</p>
              {showQr ? (
                <div className="flex flex-col items-center gap-2">
                  <QrConnect patientId={conversation.patientId} />
                  <p className="text-xs text-gray-400">ให้ผู้ป่วย/ญาติสแกนด้วยมือถือเพื่อเพิ่มเพื่อน LINE</p>
                </div>
              ) : (
                <Button type="button" onClick={() => setShowQr(true)}>
                  เชื่อมต่อ LINE
                </Button>
              )}
            </div>
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
