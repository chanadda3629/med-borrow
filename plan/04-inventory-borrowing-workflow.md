# Epic 2: Core Inventory & Borrowing Workflow

## Feature Name

Real-time Medical Equipment Inventory & Borrowing Workflow Engine

## Goal

Prevent over-booking, track every physical equipment item, reduce equipment loss, and keep inventory status accurate throughout the borrow/return lifecycle.

## Users

- เจ้าหน้าที่ศูนย์ประคองกาย.
- Administrators who audit inventory status.

## User Stories

### Story 1: Inventory Check Before Approval

As staff, I want to check equipment status and remaining inventory before approving a request so I do not approve unavailable equipment.

### Story 2: Workflow and Return Capture

As staff, I want to move borrowing requests through the workflow and capture return condition data so equipment status and inventory counts update automatically.

## Functional Requirements

### Inventory Data

Each physical equipment item must have:

- Unique item ID.
- Equipment code.
- Asset number / เลขครุภัณฑ์.
- Equipment type.
- Received date.
- Current status.

Equipment types:

- เตียงผู้ป่วย.
- รถเข็น.
- Walker.
- ไม้เท้า.
- เครื่องดูดเสมหะ.
- ถังออกซิเจน.
- ที่นอนลม.
- โต๊ะคร่อมเตียง.
- โถสุขภัณฑ์เคลื่อนที่.

### Equipment Status State Machine

Supported statuses:

- พร้อมใช้งาน.
- ถูกยืม.
- รอรับคืน.
- ชำรุด.
- ซ่อมบำรุง.

Rules:

- Only equipment in `พร้อมใช้งาน` can be assigned to a new approved borrowing request.
- Returned equipment can become `พร้อมใช้งาน` or `ชำรุด` depending on return inspection.
- Damaged equipment must not be counted as available.

### Borrowing Workflow

Workflow:

1. รับคำร้อง.
2. ประเมินผู้ป่วย.
3. AI แนะนำอุปกรณ์.
4. ตรวจสอบคลังอุปกรณ์.
5. อนุมัติ.
6. เตรียมจัดส่ง.
7. จัดส่งสำเร็จ.
8. รอคืน.
9. คืนอุปกรณ์.
10. ปิดรายการ.

Rules:

- The system must control request state transitions.
- Staff cannot skip required steps.
- Example: `จัดส่งสำเร็จ` can only be selected after `เตรียมจัดส่ง`.
- Approval must bind a specific serialized equipment item to the request.

### Auto Stock Adjustment

On approval:

- Staff selects a specific equipment item.
- Selected item status changes to `ถูกยืม`.
- Available count for that equipment type decreases by 1.

On return complete:

- If item condition is usable, status changes to `พร้อมใช้งาน`.
- Available count increases by 1.
- If item condition is damaged, status changes to `ชำรุด`.
- Available count does not increase.
- Damaged count increases by 1.

### Return Management

Capture:

- Return date.
- Receiving staff.
- Equipment photo.
- Equipment condition.
- Damage note, if applicable.

Rules:

- Return screen must require equipment photo capture/upload.
- Damage note is required when condition is damaged.
- Return action must update the equipment item and request status together.

## Acceptance Criteria

### Scenario 1: Approval Deducts Serialized Stock

Given a request for `เตียงผู้ป่วย` is in `ตรวจสอบคลังอุปกรณ์`, and item `BED-001` is `พร้อมใช้งาน`, when staff approves the request and links `BED-001`, then `BED-001` changes to `ถูกยืม` and available bed count decreases by 1.

### Scenario 2: Damaged Return

Given equipment `WC-999` is `ถูกยืม` or `รอรับคืน`, when staff records return with condition `ชำรุด`, uploads damage photo, and saves, then `WC-999` changes to `ชำรุด`, available count does not increase, and damaged count increases by 1.

## Constraints

- Do not support approval without selecting a serialized equipment item.
- Do not support bulk stock deduction without item identification.
- Reservation queue is out of Phase 1 scope.
- If equipment is unavailable, staff cannot reserve a future queue in Phase 1.
