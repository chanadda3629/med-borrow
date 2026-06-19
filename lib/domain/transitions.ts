import {
  BORROW_WORKFLOW_STATUSES,
  EQUIPMENT_STATUSES,
} from "./constants";
import type { BorrowWorkflowStatus, EquipmentStatus } from "./schemas";

const BORROW_WORKFLOW_TRANSITIONS: Record<
  BorrowWorkflowStatus,
  readonly BorrowWorkflowStatus[]
> = {
  "รับคำร้อง": ["ประเมินผู้ป่วย"],
  "ประเมินผู้ป่วย": ["AI แนะนำอุปกรณ์"],
  "AI แนะนำอุปกรณ์": ["ตรวจสอบคลังอุปกรณ์"],
  "ตรวจสอบคลังอุปกรณ์": ["อนุมัติ", "ไม่อนุมัติ"],
  อนุมัติ: ["เตรียมจัดส่ง"],
  "ไม่อนุมัติ": ["ปิดรายการ"],
  "เตรียมจัดส่ง": ["จัดส่งสำเร็จ"],
  "จัดส่งสำเร็จ": ["รอคืน"],
  "รอคืน": ["คืนอุปกรณ์"],
  "คืนอุปกรณ์": ["ปิดรายการ"],
  "ปิดรายการ": [],
};

const EQUIPMENT_STATUS_TRANSITIONS: Record<
  EquipmentStatus,
  readonly EquipmentStatus[]
> = {
  พร้อมใช้งาน: ["ถูกยืม"],
  ถูกยืม: ["รอรับคืน"],
  "รอรับคืน": ["พร้อมใช้งาน", "ชำรุด"],
  ชำรุด: ["ซ่อมบำรุง"],
  "ซ่อมบำรุง": ["พร้อมใช้งาน"],
};

export function getNextBorrowWorkflowStatuses(
  status: BorrowWorkflowStatus,
): readonly BorrowWorkflowStatus[] {
  return BORROW_WORKFLOW_TRANSITIONS[status];
}

export function canTransitionBorrowWorkflowStatus(
  fromStatus: BorrowWorkflowStatus,
  toStatus: BorrowWorkflowStatus,
): boolean {
  return BORROW_WORKFLOW_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getNextEquipmentStatuses(
  status: EquipmentStatus,
): readonly EquipmentStatus[] {
  return EQUIPMENT_STATUS_TRANSITIONS[status];
}

export function canTransitionEquipmentStatus(
  fromStatus: EquipmentStatus,
  toStatus: EquipmentStatus,
): boolean {
  return EQUIPMENT_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

export function canAssignEquipmentItem(
  currentStatus: EquipmentStatus,
  currentLoanRequestId: string | null | undefined,
): boolean {
  return currentStatus === "พร้อมใช้งาน" && !currentLoanRequestId;
}

export function isBorrowWorkflowTerminal(
  status: BorrowWorkflowStatus,
): boolean {
  return status === "ไม่อนุมัติ" || status === "ปิดรายการ";
}

export function getBorrowWorkflowStatuses(): readonly BorrowWorkflowStatus[] {
  return BORROW_WORKFLOW_STATUSES;
}

export function getEquipmentStatuses(): readonly EquipmentStatus[] {
  return EQUIPMENT_STATUSES;
}

