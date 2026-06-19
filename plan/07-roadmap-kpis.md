# Roadmap, KPIs, and Phase Boundaries

## Phase 1 KPIs

### Operational KPIs

- Reduce request recording time by at least 50%.
- Reduce paper documents by at least 80%.
- Reduce patient information lookup time by at least 70%.

### Inventory KPIs

- Track 100% of equipment items.
- Reduce asset loss by at least 90%.
- Support real-time inventory checks.

### AI KPIs

- Equipment recommendation accuracy at least 80%.
- Reduce equipment assessment time by at least 50%.

### System KPIs

- System availability at least 99%.
- GPS accuracy at least 95%.
- LINE notification success rate at least 95%.

## Phase 1 Non-Goals

- AI image analysis of patient photos.
- Predictive equipment-demand forecasting.
- Equipment reservation queue.
- Two-way LINE chatbot.
- Predictive executive dashboard.

## Phase 2 Roadmap

- AI image analysis for patient photos.
- AI demand forecasting for equipment.
- Equipment reservation queue.
- Area-based patient trend analytics.
- Predictive dashboard for administrators.

## Delivery Milestones

### Milestone 1: Foundation

- Domain models and database schema.
- Authentication/roles if required by the app architecture.
- Patient, address, equipment, request, and notification tables.

### Milestone 2: Patient Intake

- Patient registration.
- Address dropdowns.
- GPS pinning and Google Maps link storage.
- Photo upload.
- Medical checklist.

### Milestone 3: AI Recommendation

- AI service contract.
- Request payload builder.
- Recommendation result UI.
- Staff override.

### Milestone 4: Inventory and Borrowing

- Serialized equipment inventory.
- Status state machine.
- Approval and item binding.
- Auto stock adjustment.

### Milestone 5: Return Management

- Return form.
- Required return photo.
- Condition and damage notes.
- Status/count update rules.

### Milestone 6: Notifications and Analytics

- LINE notification triggers.
- Notification logging.
- Dashboard metrics.
- Heat map view.

## Agent Handoff Checklist

Before starting a task, an agent should identify:

- Which epic file owns the behavior.
- Which domain entities are affected.
- Which state transitions or validations apply.
- Which acceptance criteria should be tested.
- Whether the work is Phase 1 scope or Phase 2 scope.
