# Mobile UI/UX Plan

## Design Target

Mobile-first application for staff who may not be highly technical. The interface should reduce typing, guide workflow steps, and make important status changes clear.

## Platforms

- Android.
- iOS.

## Main Screens

1. Dashboard.
2. เพิ่มคำร้องใหม่.
3. รายการผู้ป่วย.
4. คลังอุปกรณ์.
5. รายงาน.
6. โปรไฟล์.

## Navigation Model

Recommended primary tabs:

- Dashboard.
- Requests.
- Patients.
- Inventory.
- Reports.

Profile/settings can be accessible from the top bar or account menu.

## UX Principles

- Use checklists instead of free typing where possible.
- Use dropdowns for structured address data.
- Minimize the number of form steps.
- Show clear progress through the borrowing workflow.
- Support camera and gallery upload directly from mobile.
- Support map pinning without making staff manually copy coordinates.
- Show inventory availability before approval actions.
- Make destructive or irreversible status changes confirmable.

## Patient Intake Flow

Recommended steps:

1. Personal information.
2. Address and map pin.
3. Photos.
4. Medical checklist.
5. AI recommendation result.
6. Request summary.

Important UI behavior:

- Inline validation on national ID and phone number.
- Red error text under invalid fields.
- Keep user-entered data when validation fails.
- Show saved coordinates and map preview after pin selection.

## Borrowing Workflow UI

Each request detail should show:

- Current workflow status.
- Patient summary.
- AI recommendation result.
- Selected equipment.
- Inventory availability.
- Next valid action.
- History of status changes.

Do not show invalid workflow actions as primary actions. For example, do not allow `จัดส่งสำเร็จ` before `เตรียมจัดส่ง`.

## Inventory UI

Inventory list should support:

- Filter by equipment type.
- Filter by status.
- Search by asset number.
- Show available count per equipment type.
- Open item detail with status history.

Approval screen must require selecting a specific item, not just an equipment type.

## Return UI

Return screen should include:

- Item identity.
- Return date.
- Receiving staff.
- Required equipment photo.
- Condition selector.
- Damage note field when condition is damaged.

## Dashboard UI

Dashboard should show:

- Total patients.
- Active loans.
- Available inventory.
- On-loan inventory.
- Damaged inventory.
- Heat map section.

Use compact cards or metric blocks suitable for mobile scanning.
