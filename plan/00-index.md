# Medical Equipment Lending App - Plan Index

This directory breaks `PRD.md` and `FEATURES.md` into focused implementation files for agent-based development.

## Recommended Build Order

1. [01-product-scope.md](./01-product-scope.md)
   - Product vision, users, core problems, success metrics, and phase boundaries.

2. [02-domain-data-model.md](./02-domain-data-model.md)
   - Main domain entities, statuses, validation rules, and integration data.

3. [03-patient-intake-ai-assessment.md](./03-patient-intake-ai-assessment.md)
   - Patient registration, address dropdowns, GPS pinning, media upload, medical checklist, and AI recommendation interface.

4. [04-inventory-borrowing-workflow.md](./04-inventory-borrowing-workflow.md)
   - Item-level equipment inventory, borrowing state machine, stock adjustment, approval, delivery, and return management.

5. [05-notifications-analytics.md](./05-notifications-analytics.md)
   - LINE notifications, dashboard metrics, and heat map analytics.

6. [06-mobile-ui-ux.md](./06-mobile-ui-ux.md)
   - Mobile-first screens, navigation, form behavior, and UX principles.

7. [07-roadmap-kpis.md](./07-roadmap-kpis.md)
   - Phase 1 KPIs, non-goals, and Phase 2 roadmap.

## Phase 1 Epic Summary

| Epic | Goal | Primary Files |
| --- | --- | --- |
| Patient Intake & AI-Assisted Assessment | Digitize patient intake and support equipment selection with AI | `03-patient-intake-ai-assessment.md` |
| Core Inventory & Borrowing Workflow | Track serialized equipment and prevent over-booking | `04-inventory-borrowing-workflow.md` |
| Notifications & Analytics Dashboard | Notify relatives and give administrators operational visibility | `05-notifications-analytics.md` |

## Implementation Rule of Thumb

Agents should treat each plan file as a bounded work package. Before coding a feature, read `01-product-scope.md` and `02-domain-data-model.md`, then read the specific feature file for that work.
