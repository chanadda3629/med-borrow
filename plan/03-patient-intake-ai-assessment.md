# Epic 1: Patient Intake & AI-Assisted Assessment

## Feature Name

Patient Onboarding and AI Clinical Assessment System

## Goal

Digitize patient registration, reduce paper-based intake, prevent address-entry mistakes, capture patient/home context, and use AI as decision support for equipment recommendations.

## Users

- Primary: เจ้าหน้าที่ศูนย์ประคองกาย.
- Supporting: ญาติผู้ป่วย, when providing patient details.

## User Stories

### Story 1: Patient Intake

As staff, I want to enter patient information, attach photos, choose address data from dropdowns, pin GPS on Google Maps, and complete a physical ability checklist so patient data is accurate and ready for AI assessment.

### Story 2: AI Recommendation Review

As staff, I want to see recommended equipment with matching scores so I can choose the best equipment for the patient's condition while keeping final decision authority.

## Functional Requirements

### Patient Registration

Capture:

- Full name.
- National ID.
- Date of birth.
- Age.
- Gender.
- Phone number.

Validation:

- National ID must be 13 numeric digits.
- Phone number must be 10 numeric digits and match mobile number format.
- Invalid fields must show inline red error text and field highlighting.
- Invalid data must not be saved.

### Address & Location

Capture:

- House number.
- Moo.
- Province.
- District.
- Subdistrict.
- Postal code.
- Latitude.
- Longitude.
- Google Maps link.

Behavior:

- Use cascading dropdowns in order: province -> district -> subdistrict.
- Auto-populate postal code when selected address supports it.
- Let staff open Google Maps, search, and drop a pin.
- Save latitude, longitude, and generated Google Maps link to the database.

### Media Upload

Support mobile capture or upload for:

- Patient photo.
- Home-environment photo.
- Other supporting photos if needed.

Phase 1 note:

- Images are for staff visual review only.
- AI image processing is not in Phase 1.

### Medical Assessment

Capture:

- Chronic diseases.
- Walking ability.
- Self-care ability.
- Patient condition.
- Urgency level.
- Checklist answers.

Checklist:

- เดินเองได้.
- เดินได้โดยใช้ Walker.
- ใช้รถเข็น.
- ติดเตียง.
- ต้องการออกซิเจน.
- มีแผลกดทับ.
- ช่วยเหลือตนเองไม่ได้.

### AI Recommendation Interface

Send payload to AI service:

- Age.
- Gender.
- Chronic diseases.
- Checklist assessment result.
- Urgency level.
- Image references or metadata, if available.

Receive and display:

- Ranked list of equipment.
- Matching score percentage.
- Optional explanation.

Required interaction:

- Show recommendations from highest score to lowest score.
- Allow staff to confirm AI recommendation.
- Allow staff to override and select a different equipment type.

Example result:

| Equipment | Score |
| --- | --- |
| เตียงผู้ป่วย | 95% |
| รถเข็น | 90% |
| ที่นอนลม | 85% |

## Acceptance Criteria

### Scenario 1: GPS and Address Saved

Given staff is on the add-patient screen, when staff completes personal data, selects address dropdowns, pins the location on Google Maps, and saves, then the system saves patient data with latitude, longitude, and Google Maps link, then proceeds to the next step.

### Scenario 2: Validation Failure

Given staff enters an invalid national ID or phone number, when staff taps next or save, then the system blocks saving, shows inline red error text under the invalid fields, and highlights the invalid inputs.

### Scenario 3: AI Recommendation Success

Given staff has completed the checklist and uploaded required photos, when the system sends data to the AI service successfully, then the screen displays ranked equipment recommendations with matching scores and provides controls to confirm or override the recommendation.

## Constraints

- AI recommendations support staff decisions but do not make final decisions.
- AI calculation in Phase 1 is primarily based on text and checklist data.
- Patient images are not automatically analyzed by AI in Phase 1.
