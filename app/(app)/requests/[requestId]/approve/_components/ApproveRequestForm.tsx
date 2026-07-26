"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { approveRequest } from "@/lib/actions/requests/approve-request"
import { rejectRequest } from "@/lib/actions/requests/reject-request"
import { REJECTION_REASONS } from "@/lib/domain/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

interface AvailableItem {
  id: string
  assetNumber: string
  equipmentCode: string
}

interface ApproveRequestFormProps {
  requestId: string
  availableItems: AvailableItem[]
}

type Decision = "อนุมัติ" | "ไม่อนุมัติ"

// Verification checklist staff confirm before approving. Every item must be
// ticked (plus an item selected and an approver named) to enable approval —
// approval is only possible when there is ready equipment to allocate.
const APPROVAL_CHECKS = [
  "ตรวจสอบแล้วว่ามีอุปกรณ์ประเภทที่ขอพร้อมใช้งานในคลัง",
  "เลือกอุปกรณ์ที่จะจัดสรรให้ผู้ป่วยแล้ว",
  "ตรวจสอบสภาพอุปกรณ์เรียบร้อย พร้อมส่งมอบ",
] as const

export function ApproveRequestForm({ requestId, availableItems }: ApproveRequestFormProps) {
  const router = useRouter()
  const hasItems = availableItems.length > 0

  // Default the decision to reject when nothing is available to allocate.
  const [decision, setDecision] = useState<Decision>(hasItems ? "อนุมัติ" : "ไม่อนุมัติ")
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [approverName, setApproverName] = useState<string>("")
  const [checks, setChecks] = useState<boolean[]>(APPROVAL_CHECKS.map(() => false))
  const [rejectionReason, setRejectionReason] = useState<string>(REJECTION_REASONS[0])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const allChecked = checks.every(Boolean)
  const canApprove = hasItems && !!selectedItemId && !!approverName.trim() && allChecked

  function toggleCheck(index: number) {
    setChecks((prev) => prev.map((v, i) => (i === index ? !v : v)))
    setError(null)
  }

  async function handleApprove() {
    if (!canApprove) return
    setError(null)
    setSubmitting(true)
    try {
      const result = await approveRequest(requestId, {
        equipmentItemId: selectedItemId,
        approverName: approverName.trim(),
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/requests/${requestId}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    setError(null)
    setSubmitting(true)
    try {
      const result = await rejectRequest(requestId, { rejectionReason })
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/requests/${requestId}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Decision selector */}
      <div className="grid grid-cols-2 gap-2">
        <DecisionOption
          label="อนุมัติ"
          active={decision === "อนุมัติ"}
          disabled={!hasItems}
          activeClass="border-success bg-success-soft text-success-text"
          onClick={() => {
            setDecision("อนุมัติ")
            setError(null)
          }}
        />
        <DecisionOption
          label="ไม่อนุมัติ"
          active={decision === "ไม่อนุมัติ"}
          activeClass="border-danger bg-danger-soft text-danger-text"
          onClick={() => {
            setDecision("ไม่อนุมัติ")
            setError(null)
          }}
        />
      </div>

      {!hasItems && (
        <p className="text-sm text-muted">
          ไม่มีอุปกรณ์ประเภทที่ขอที่พร้อมใช้งาน จึงไม่สามารถอนุมัติได้
          กรุณาระบุสาเหตุการไม่อนุมัติด้านล่าง
        </p>
      )}

      {decision === "อนุมัติ" && hasItems && (
        <div className="space-y-4">
          {/* Item selection */}
          <div className="space-y-2">
            {availableItems.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-all duration-150 ease-apple ${
                  selectedItemId === item.id
                    ? "border-accent-500 bg-accent-50"
                    : "border-border hover:border-faint"
                }`}
              >
                <input
                  type="radio"
                  name="equipmentItem"
                  value={item.id}
                  checked={selectedItemId === item.id}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value)
                    setError(null)
                  }}
                  className="accent-accent-500"
                />
                <div>
                  <div className="font-medium text-sm">{item.assetNumber}</div>
                  <div className="text-xs text-muted">รหัส: {item.equipmentCode}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Verification checklist */}
          <div className="space-y-2">
            <Label>รายการตรวจสอบก่อนอนุมัติ</Label>
            <div className="space-y-2">
              {APPROVAL_CHECKS.map((text, index) => (
                <label key={text} className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={checks[index]}
                    onChange={() => toggleCheck(index)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground">{text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Approver name (required to approve) */}
          <div className="space-y-1.5">
            <Label htmlFor="approverName">ชื่อผู้อนุมัติ</Label>
            <Input
              id="approverName"
              value={approverName}
              onChange={(e) => {
                setApproverName(e.target.value)
                setError(null)
              }}
              placeholder="กรอกชื่อ-สกุลผู้อนุมัติ"
            />
          </div>
        </div>
      )}

      {/* Rejection: pick a reason */}
      {decision === "ไม่อนุมัติ" && (
        <div className="space-y-1.5">
          <Label htmlFor="rejectionReason">สาเหตุการไม่อนุมัติ</Label>
          <Select
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          >
            {REJECTION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger-text bg-danger-soft border border-danger rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      {decision === "อนุมัติ" ? (
        <ConfirmDialog
          trigger={
            <Button className="w-full" disabled={!canApprove || submitting}>
              อนุมัติและจัดสรรอุปกรณ์
            </Button>
          }
          title="ยืนยันการอนุมัติ"
          description="ต้องการอนุมัติคำร้องและจัดสรรอุปกรณ์ที่เลือกใช่หรือไม่?"
          onConfirm={handleApprove}
        />
      ) : (
        <ConfirmDialog
          trigger={
            <Button variant="destructive" className="w-full" disabled={submitting}>
              ไม่อนุมัติคำร้อง
            </Button>
          }
          title="ยืนยันการไม่อนุมัติ"
          description={`ต้องการไม่อนุมัติคำร้องนี้ด้วยสาเหตุ "${rejectionReason}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้`}
          confirmLabel="ไม่อนุมัติ"
          variant="destructive"
          onConfirm={handleReject}
        />
      )}
    </div>
  )
}

function DecisionOption({
  label,
  active,
  disabled,
  activeClass,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  activeClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md border-2 px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-apple ${
        active ? activeClass : "border-border text-muted hover:border-faint"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {label}
    </button>
  )
}
