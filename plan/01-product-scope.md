# Product Scope

## Product

แอปยืมอุปกรณ์ทางการแพทย์ (Medical Equipment Lending Application)

Mobile application for managing the loan and return lifecycle of medical equipment for ศูนย์ประคองกาย and public health teams.

## Vision

Build a digital system that replaces paper, phone calls, and manual notes for medical equipment lending. The product should improve equipment tracking accuracy, reduce staff workload, provide real-time inventory visibility, support GPS-based delivery, and use AI as decision support for recommending appropriate equipment.

## Problems To Solve

- Patient information is incomplete or scattered.
- Borrow/return status is difficult to track.
- Remaining inventory cannot be checked in real time.
- Equipment suitability depends heavily on staff experience.
- Patient address lookup and delivery planning take too long.
- Borrowing history is fragmented across paper and manual records.

## Primary Goals

1. Provide a mobile-first borrow/return system for medical equipment.
2. Connect patient, equipment, and loan data in one system.
3. Use AI to recommend suitable equipment for each patient.
4. Improve equipment status tracking and reduce over-booking.
5. Reduce operational time for staff.
6. Support delivery planning with GPS and Google Maps.

## User Groups

### Primary User: เจ้าหน้าที่ศูนย์ประคองกาย

Responsibilities:

- Register patients.
- Create borrowing requests.
- Review patient assessment data.
- Check equipment availability.
- Approve or reject borrowing.
- Arrange delivery.
- Receive returned equipment.

### Secondary User: ญาติผู้ป่วย

Responsibilities and needs:

- Provide patient information.
- Receive LINE notifications.
- Track borrowing status without calling staff.

### Administrative User: ผู้บริหาร

Responsibilities and needs:

- View dashboard summaries.
- Review borrowing statistics.
- Analyze equipment usage.
- Plan future equipment purchases.

## Core User Stories

| ID | User Story |
| --- | --- |
| US-01 | As staff, I want to record patient information on mobile so patient data is stored systematically. |
| US-02 | As staff, I want to attach patient and home-environment photos so equipment decisions have supporting context. |
| US-03 | As staff, I want to pin the patient's home location so delivery can be planned accurately. |
| US-04 | As staff, I want AI to analyze patient data so it can recommend suitable equipment. |
| US-05 | As staff, I want to view remaining equipment inventory so I do not approve unavailable equipment. |
| US-06 | As an administrator, I want a usage dashboard so I can plan resources. |

## Phase 1 Scope

- Patient intake and validation.
- Address dropdown selection and postal code population.
- GPS pinning and Google Maps link storage.
- Photo upload or capture.
- Medical assessment checklist.
- AI recommendation API interface using text/checklist data.
- Serialized equipment inventory.
- Borrowing workflow state machine.
- Return management with photo and condition capture.
- One-way LINE notifications.
- Dashboard metrics and heat map.

## Phase 1 Non-Goals

- AI image processing for patient photos.
- Reservation queue for unavailable equipment.
- Two-way LINE chatbot interaction.
- Predictive AI dashboard.
