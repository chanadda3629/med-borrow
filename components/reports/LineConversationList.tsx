"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { LineChatPanel } from "./LineChatPanel"
import type { Trigger } from "@/lib/integrations/line/notification-service"

export interface TimelineEntry {
  id: string
  kind: "notification" | "chat"
  direction: "inbound" | "outbound"
  body: string
  deliveryStatus: string | null
  createdAt: string
}

export interface ConversationSummary {
  patientId: string
  fullName: string
  linked: boolean
  lastActivityAt: string
  lastMessagePreview: string
  activeRequest: {
    id: string
    workflowStatus: string
    approvalDecision: string | null
    equipmentType: string
    dueOrReturnDate: string | null
    daysRemaining: number | null
    availableTriggers: Trigger[]
  } | null
  timeline: TimelineEntry[]
}

interface LineConversationListProps {
  conversations: ConversationSummary[]
}

export function LineConversationList({ conversations }: LineConversationListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = conversations.find((c) => c.patientId === selectedId) ?? null

  if (conversations.length === 0) {
    return <p className="p-4 text-sm text-faint">ยังไม่มีประวัติ</p>
  }

  return (
    <>
      <div className="divide-y divide-hairline">
        {conversations.map((c) => (
          <button
            key={c.patientId}
            type="button"
            onClick={() => setSelectedId(c.patientId)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 ease-apple hover:bg-canvas"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground">{c.fullName}</p>
                {!c.linked && <Badge variant="secondary">ยังไม่เชื่อมต่อ</Badge>}
              </div>
              <p className="truncate text-sm text-muted">{c.lastMessagePreview}</p>
            </div>
            <span className="shrink-0 text-xs text-faint">
              {new Date(c.lastActivityAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <LineChatPanel key={selected.patientId} conversation={selected} onClose={() => setSelectedId(null)} />
      )}
    </>
  )
}
