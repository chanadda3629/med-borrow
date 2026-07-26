# PRODUCT.md — Product Context & Screen Hierarchy

Companion to [DESIGN.md](DESIGN.md). DESIGN.md defines *what the tokens are*; this
file defines *how they apply per screen* — what draws the eye first, the single
primary action, how list items rank information, and each screen's empty/loading
states. Read both before Phase 2.

Source of truth for scope: `PRD.md`, `FEATURES.md`, `plan/01-product-scope.md`.

---

## 1. Product in one paragraph

A mobile-first PWA that replaces paper and phone calls for lending medical
equipment at a palliative care center (ศูนย์ประคองกาย). Staff register patients,
assess needs, get AI equipment recommendations (decision support only — staff
always approve), manage **serialized** inventory, run an ordered borrow → deliver →
return workflow, and send one-way LINE notifications. Thai UI throughout.

## 2. Users

| User | Uses the app for | Design implication |
|---|---|---|
| **เจ้าหน้าที่** (primary) | Register, assess, approve, deliver, receive returns — all day, on phone, sometimes in low light | Ergonomics first: 44px targets, bottom-reachable primary actions, calm surfaces for long sessions |
| **ญาติผู้ป่วย** (secondary) | Receive LINE updates, track status | Not an in-app screen (Phase 1) — status vocabulary must read plainly |
| **ผู้บริหาร** (admin) | Dashboard, stats, purchase planning | Dashboard readability; admin-only actions (e.g. add inventory) |

## 3. Global hierarchy rules

Apply on every screen:

1. **One primary action per screen** — solid `accent-500`. Everything else is
   secondary/tertiary. If two actions look equally important, one is wrong.
2. **Eye path:** page title (top bar) → primary content/list → status signals →
   primary action. Status badges carry semantic color; nothing else competes for
   that color.
3. **List ranking:** Title (who/what) 15–16px semibold → Meta (phone/date/type)
   13px secondary → Status badge (semantic) → chevron. See DESIGN.md §8.
4. **Color discipline:** accent = actions/nav only. Semantic color = status only.
   Content stays neutral. No decorative color.
5. **States are not afterthoughts:** every list/detail screen defines empty +
   loading (skeleton) per DESIGN.md §8.

---

## 4. Screen-by-screen

### Dashboard — `/dashboard`
- **Primary:** none dominant; it's an overview. Top metric that needs action (e.g.
  "เกินกำหนด N รายการ") uses `danger`/`warning` and is the visual anchor.
- **Content:** metric cards (white, `shadow-sm`, radius `lg`), heat map, quick
  links into `/requests` filtered by status.
- **Loading:** skeleton metric cards. **Empty:** rare — show zero-state per metric.

### Requests list — `/requests`
- **Primary action:** "เพิ่มคำร้อง" — currently a FloatingActionButton; keep as the
  single primary (accent). ✔ already the right pattern.
- **List rows:** leading status icon (soft tint circle) → reporter/patient name
  (title) → contact or equipment type (meta) → **workflow status badge** → chevron.
  Migrate the per-status hardcoded tints to the §2.4 semantic mapping.
- **Filters:** status chips = neutral until selected, then `accent` fill.
- **Empty:** Inbox icon + "ยังไม่มีคำร้องในสถานะนี้" + hint. **Loading:** skeleton rows.

### Request detail & workflow steps — `/requests/[id]`, `/assess`, `/ai`, `/approve`, `/loan`, `/deliver`, `/return`
- **Ordered, non-skippable workflow** (11 statuses). Each step screen has **exactly
  one primary action** = the button that advances to the next status (e.g.
  "อนุมัติ", "ยืนยันจัดส่ง", "รับคืนอุปกรณ์").
- **Status history** rendered as a vertical timeline; current step emphasized with
  its semantic color, past steps muted (`text-secondary`), future steps `border`.
- **AI step (`/ai`):** recommendation is decision-support — present as an
  `info`-tinted suggestion card, never pre-approved. Staff's approve/reject buttons
  are the primary/secondary pair. Requires a visible fallback state if AI fails.
- **Destructive** ("ไม่อนุมัติ" / cancel): danger treatment, never the visual peer of
  the advance action.

### Inventory list — `/inventory`
- **Primary action:** "+ เพิ่มอุปกรณ์" — **admin only**, in the top bar (secondary→
  promote to primary styling since it's the page's main create action).
- **Serialized items** (`equipmentCode` + `assetNumber`) — title = type + code, meta
  = asset number / donor / received date, **status badge** (§2.4 equipment mapping),
  **condition** as a second small badge.
- **Table on wider screens**, cards/rows on mobile — unify status/condition badges
  across both. **Empty:** package icon + hint. **Loading:** skeleton.

### Inventory detail — `/inventory/[itemId]`
- **Primary:** context-dependent status action (e.g. mark ซ่อมบำรุง / return to ว่าง).
- Show current loan link if `ถูกยืม`. Photos, condition history.

### New request / New item — `/requests/new`, `/inventory/new`
- Long forms — the workhorse screens. Apply DESIGN.md input spec strictly:
  outlined, label-above, 44px, focus ring, inline error.
- **One primary** "บันทึก" (accent, with in-button spinner on submit) + secondary
  "ยกเลิก". Validation: national ID = 13 digits, phone = 10 digits (Zod), errors
  shown inline in `danger`.

### Reports — `/reports`
- Admin-oriented. Charts/stats on white cards. Accent used only for interactive
  controls; data series use a documented categorical palette (keep distinct from
  the 4 semantic colors to avoid "status" misreading).

### Login — `/login`
- Single centered card, one primary "เข้าสู่ระบบ". Minimal, calm. The one screen
  with no bottom tab bar.

---

## 5. Known inconsistencies to fix in Phase 2

Found during the audit — these are why the system is needed:

- **Hardcoded Tailwind palette everywhere** (`blue-600`, `purple-600`, `teal-50`,
  `lime-100`, `amber-*`, `sky-*`, `orange-*`) in `BottomTabBar.tsx`,
  `StatusBadge.tsx`, `requests/page.tsx`, etc. → migrate all to tokens + §2.4 mapping.
- **Bottom tab bar has 6 tabs incl. two create-actions** → reduce to 4 sections;
  move creates to in-section primary buttons.
- **Two parallel status color maps** (`StatusBadge.tsx` vs `STATUS_VISUAL` in
  `requests/page.tsx`) drift apart → single source via semantic mapping.
- **`prefers-color-scheme: dark` block** in `globals.css` partially re-themes an
  app that is light-only → neutralize.
- Mixed radii / shadows / spacing chosen ad hoc per component → normalize to the
  scales in DESIGN.md §4–6.
