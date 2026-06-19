# Epic 3: Notifications & Analytics Dashboard

## Feature Name

LINE Notification Gateway & Management Dashboard Analytics

## Goal

Reduce follow-up phone calls by automatically notifying relatives through LINE, and give administrators real-time or near-real-time visibility into patients, loans, inventory, damaged items, and geographic demand.

## Users

- ญาติผู้ป่วย.
- ผู้บริหาร.
- Senior staff.

## User Stories

### Story 1: Relative Notifications

As a relative, I want LINE notifications whenever borrowing status changes so I can prepare for delivery or return without calling staff.

### Story 2: Management Dashboard

As an administrator, I want summary metrics and a patient density heat map so I can analyze trends and plan equipment purchases.

## Functional Requirements

### LINE Notification Triggers

Send LINE notifications when:

- Request submitted successfully.
- Approved.
- Rejected.
- Preparing delivery.
- Delivery completed.
- Return due date is near.
- Equipment returned.

Behavior:

- Trigger message automatically when workflow status changes.
- Send to the relative contact channel linked to the patient or request.
- Log notification status and timestamp.
- Target delivery time: under 5 seconds for normal successful sends.

Phase 1 limitation:

- One-way broadcast/push only.
- No two-way chatbot support.

### Dashboard Metrics

Show five core metrics:

- Total patients.
- Active loans.
- Available inventory by equipment type.
- On-loan inventory.
- Damaged inventory.

Behavior:

- Metrics should be real-time or near-real-time.
- Inventory counts must derive from serialized equipment item statuses.
- Active loans must derive from borrowing request statuses.

### Geographic Heat Map

Inputs:

- Latitude and longitude of active patients.
- Patient or borrowing status.
- Area metadata when available.

Behavior:

- Render active patient coordinates on a map component.
- Display heat intensity by geographic density.
- Support administrative review of high-demand areas.

## Acceptance Criteria

### Scenario 1: Workflow Status Sends LINE Message

Given the system has stored the relative's LINE contact, when staff changes a request from `เตรียมจัดส่ง` to `จัดส่งสำเร็จ`, then the LINE webhook/send service runs immediately and the relative receives a message equivalent to `อุปกรณ์จัดส่งสำเร็จเรียบร้อยแล้ว` within 5 seconds under normal conditions.

### Scenario 2: Heat Map Density

Given 50 active pinned patients are in `อำเภอเมือง` and 5 active pinned patients are in `อำเภอหางดง`, when an administrator opens Dashboard Analytics, then the map shows stronger heat intensity in `อำเภอเมือง` and lighter intensity in `อำเภอหางดง`.

## Constraints

- Dashboard is historical and current data only in Phase 1.
- Predictive AI dashboard is Phase 2.
- LINE notifications should not block the main workflow transition if the message provider is temporarily unavailable; log failure for retry or staff review.
