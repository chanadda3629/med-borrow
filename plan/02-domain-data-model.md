# Domain Data Model

This file defines the shared domain vocabulary that all feature agents should follow.

## Main Entities

### Patient

Required fields:

- Full name.
- National ID number.
- Date of birth.
- Age.
- Gender.
- Phone number.
- Address.
- Latitude.
- Longitude.
- Google Maps link.
- Patient/home-environment photos.
- Medical assessment data.

Validation:

- National ID must be exactly 13 numeric digits.
- Phone number must be exactly 10 numeric digits and follow a valid mobile-phone format.

### Address

Fields:

- House number.
- Moo.
- Subdistrict / ตำบล.
- District / อำเภอ.
- Province / จังหวัด.
- Postal code.

Rules:

- Address selection should use cascading dropdowns: province -> district -> subdistrict.
- Postal code should auto-populate when possible.
- Manual free text should be minimized to reduce human error.

### Medical Assessment

Fields:

- Age.
- Chronic diseases.
- Walking ability.
- Self-care ability.
- Patient condition.
- Urgency level.
- Checklist answers.
- Supporting images.

Checklist options:

- เดินเองได้.
- เดินได้โดยใช้ Walker.
- ใช้รถเข็น.
- ติดเตียง.
- ต้องการออกซิเจน.
- มีแผลกดทับ.
- ช่วยเหลือตนเองไม่ได้.

### Equipment Type

Initial equipment categories:

- เตียงผู้ป่วย.
- รถเข็น.
- Walker.
- ไม้เท้า.
- เครื่องดูดเสมหะ.
- ถังออกซิเจน.
- ที่นอนลม.
- โต๊ะคร่อมเตียง.
- โถสุขภัณฑ์เคลื่อนที่.

### Equipment Item

Each physical item must be serialized.

Fields:

- Equipment ID.
- Asset number / เลขครุภัณฑ์.
- Equipment type.
- Received date.
- Current status.
- Current loan/request reference, if borrowed.
- Return condition history, if applicable.

Important constraint:

- Phase 1 must not approve a borrowing request without selecting a specific serialized equipment item.
- Do not deduct stock using only aggregate quantity.

### Borrowing Request

Fields:

- Request ID.
- Patient.
- Requested or selected equipment.
- AI recommendation results.
- Assigned equipment item.
- Workflow status.
- Approval decision.
- Delivery status.
- Due/return date.
- Return data.
- Notification history.

## Equipment Statuses

- พร้อมใช้งาน.
- ถูกยืม.
- รอรับคืน.
- ชำรุด.
- ซ่อมบำรุง.

## Borrowing Workflow Statuses

Recommended state order:

1. รับคำร้อง.
2. ประเมินผู้ป่วย.
3. AI แนะนำอุปกรณ์.
4. ตรวจสอบคลังอุปกรณ์.
5. อนุมัติ or ไม่อนุมัติ.
6. เตรียมจัดส่ง.
7. จัดส่งสำเร็จ.
8. รอคืน.
9. คืนอุปกรณ์.
10. ปิดรายการ.

Rules:

- State transitions must follow the defined order.
- Do not allow skipping required states.
- Inventory must update atomically with approval and return actions.

## AI Recommendation Result

Response shape should support:

- Equipment type.
- Matching score percentage.
- Explanation or reason, if available.
- Ranking order.

Staff must retain final decision authority and must be able to override the AI recommendation.

## Integrations

### Google Maps

Store:

- Latitude.
- Longitude.
- Generated Google Maps link.

Required behavior:

- Open map.
- Search address.
- Drop or adjust pin.
- Save coordinates automatically.

### LINE Notification

Store:

- Relative contact channel, such as phone or LINE ID.
- Notification trigger.
- Message delivery status.
- Timestamp.

Phase 1 supports one-way push/broadcast messages only.
