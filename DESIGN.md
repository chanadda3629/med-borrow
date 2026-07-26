# DESIGN.md — Design System

Visual design system for the Medical Equipment Lending PWA (ศูนย์ประคองกาย).
Staff-facing, mobile-first, Thai-language. Derived from a structured design
interview; every value here is buildable — encode it, don't reinterpret it.

**Reference language:** apple.com / Apple Store — clean white surfaces, generous
whitespace, crisp contrast, flat content, restrained accent. Glass appears **only
on floating layers** (nav, overlays), never on resting content.

**Mode:** Light only (Phase 1). Tokens are structured so a dark theme can be added
later without restructuring.

**Font:** already chosen (IBM Plex Sans Thai). Do not change. Not covered here.

---

## 1. Core principle — the glass rule

> **Floating = glass. In-plane = opaque.**

- **Glass (frosted):** top bar, bottom tab bar, dropdowns, popovers, action menus,
  toasts, and the backdrop behind modals. These sit *above* content.
- **Opaque:** everything in the content plane — cards, forms, list rows, and any
  modal/sheet that contains a form or dense content (readability wins over effect).

This is the single most important rule. When in doubt, a surface is opaque.

---

## 2. Color tokens

### 2.1 Neutrals (Apple cool)

| Token | Utility | Hex | Use |
|---|---|---|---|
| `--color-canvas` | `bg-canvas` | `#F5F5F7` | Page background (cool light gray — the Apple signature) |
| `--color-surface` | `bg-surface` | `#FFFFFF` | Cards, forms, opaque sheets |
| `--color-surface-2` | `bg-surface-2` | `#FBFBFD` | Subtle nested/alt surface |
| `--color-foreground` | `text-foreground` | `#1D1D1F` | Primary text, titles (near-black, never pure #000) |
| `--color-muted` | `text-muted` | `#6E6E73` | Meta, descriptions, secondary labels |
| `--color-faint` | `text-faint` | `#A1A1A6` | Placeholders, disabled, timestamps |
| `--color-border` | `border-border` | `#D2D2D7` | Dividers, input borders, hairlines |
| `--color-hairline` | `border-hairline` | `#E8E8ED` | Faint separators, secondary-button fill |

> **Utility naming:** the class suffix is the part after `--color-`. Accent →
> `bg-accent-500` / `text-accent-600`. Semantic badge → `bg-success-soft` +
> `text-success-text`; semantic solid (dot/icon) → `text-success` / `bg-danger`.
> Radius → `rounded-{sm,md,lg,xl}`. Elevation → `shadow-{sm,md,lg,xl}`. Apple ease
> → `ease-apple`. Glass → `class="glass"`.

### 2.2 Accent — Trust Blue-Teal

Used sparingly: primary buttons, links, active nav, focus. **One dominant accent
moment per screen.**

| Step | Hex | Use |
|---|---|---|
| `accent-50` | `#EAF6FA` | Soft tint bg (info badge, selected row) |
| `accent-100` | `#D0EAF2` | Hover on tint |
| `accent-200` | `#A6D7E6` | |
| `accent-300` | `#6FBBD3` | |
| `accent-400` | `#3699BC` | |
| **`accent-500`** | **`#0A7EA4`** | **Primary — buttons, links, active** |
| `accent-600` | `#086A8C` | Hover / pressed |
| `accent-700` | `#075670` | Text on light tint, pressed-dark |
| `accent-800` | `#084457` | |
| `accent-900` | `#0A3846` | |

### 2.3 Semantic (each = solid / soft-bg / text-on-soft)

Muted vs raw iOS colors so they read calm on white, not neon. All pass WCAG AA.

| Role | Solid (dot/icon) | Soft bg (badge) | Text on soft | Meaning |
|---|---|---|---|---|
| **success** | `#1C8E5A` | `#E6F5EC` | `#12703F` | Returned, available, done |
| **warning** | `#C77A0A` | `#FDF1DD` | `#8A5406` | Pending, near due, needs check |
| **danger** | `#C9362B` | `#FBE9E7` | `#98261D` | Overdue, lost/damaged, rejected |
| **info** (indigo) | `#5B5BD6` | `#ECECFB` | `#3A3A9E` | In progress / processing |

Indigo is deliberately distinct from the teal accent so "in progress" never reads
as a tappable action.

### 2.4 Status → semantic mapping (authoritative)

Replaces the ad-hoc per-status Tailwind colors currently in `StatusBadge.tsx` and
`requests/page.tsx`. Every status resolves to exactly one semantic role.

**Borrow workflow (11 steps):**

| Status | Role |
|---|---|
| รับคำร้อง | info |
| ประเมินผู้ป่วย | info |
| AI แนะนำอุปกรณ์ | info |
| ตรวจสอบคลังอุปกรณ์ | info |
| อนุมัติ | success |
| ไม่อนุมัติ | danger |
| เตรียมจัดส่ง | info |
| จัดส่งสำเร็จ | success |
| รอคืน | warning |
| คืนอุปกรณ์ | success |
| ปิดรายการ | neutral (gray — `bg-surface-2` / `text-muted`) |

**Equipment status:**

| Status | Role |
|---|---|
| พร้อมใช้งาน / ว่าง | success |
| รอจัดส่ง | warning |
| ถูกยืม | info |
| รอรับคืน | warning |
| ซ่อมบำรุง | warning |
| ชำรุด | danger |

**Condition (สภาพ):** ดี → success · ซ่อมบำรุง → warning · ชำรุด → danger

---

## 3. Glass / material recipe

Applied to floating layers only (§1).

```css
/* Standard glass (nav, tab bar, overlays) */
background: rgba(255, 255, 255, 0.82);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border-top: 1px solid rgba(255, 255, 255, 0.5);      /* highlight edge */
border-bottom: 1px solid rgba(0, 0, 0, 0.06);        /* hairline separator */
```

- **Blur:** `20px` · **Saturate:** `180%` · **Fill:** white `0.82`
- **Borders:** highlight edge (facing the light) + hairline separator (facing content)
- **Fallback** (no `backdrop-filter`): opaque white `rgba(255,255,255,0.96)`.
  Provide via `@supports not (backdrop-filter: blur(1px))`.
- **Text/icons on glass:** only `--color-foreground` (`#1D1D1F`) or `--color-muted`
  (`#6E6E73`). Never tertiary gray on glass — contrast drops below AA.

---

## 4. Spacing

4px base scale (matches Tailwind default): `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`.

- Card / form inner padding: **20–24px**
- Between sections: **32–48px**
- Mobile screen gutter: **16px**
- List row vertical padding: **12–14px**

Bias toward more whitespace, not less — it is the primary Apple signal.

---

## 5. Radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `8px` | Badge, chip, small controls |
| `--radius-md` | `12px` | **Inputs, buttons** (default) |
| `--radius-lg` | `18px` | **Cards, panels** (apple.com signature) |
| `--radius-xl` | `24px` | Modal, bottom sheet |
| `--radius-full` | `9999px` | Avatar, toggle, floating pill nav |

Buttons are **12px rounded rectangles**, not pills.

---

## 6. Elevation

Resting content cards: **white + soft shadow, no border.**
Floating layers: shadow scale below. Apple shadows = large radius, low opacity,
slight downward offset — never heavy/dark.

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.05)` | Resting cards, list rows, raised buttons |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04)` | Dropdown, popover, card hover |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.05)` | Prominent floating cards |
| `--shadow-xl` | `0 24px 64px rgba(0,0,0,.16)` | Modal, bottom sheet |

Card hover: lift `sm → md` over 150ms.

---

## 7. Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--ease-fast` | `150ms` | `ease-out` | Hover, color change, toggle, button press |
| `--ease-base` | `250ms` | `cubic-bezier(.32,.72,0,1)` | Dropdown, popover, tab switch |
| `--ease-slow` | `350ms` | `cubic-bezier(.32,.72,0,1)` | Modal/sheet enter, page transition |

**What animates:**
- Modal / bottom sheet: `translateY` up + fade; backdrop dims in parallel.
- Dropdown / popover: fade + scale `0.96 → 1` from the trigger origin.
- Toast: slide in from top + fade.
- Card hover: shadow lift `sm → md`.
- **Button press: scale `0.97`** (iOS tactile feedback) — global on all buttons/taps.

**Reduced motion (always on):**
```css
@media (prefers-reduced-motion: reduce) {
  /* disable all translate/scale; keep opacity fades only */
}
```

---

## 8. Components

### Buttons (radius `md` 12px, min-height 44px, press-scale 0.97)

| Variant | Treatment | Use |
|---|---|---|
| **Primary** | Solid `accent-500`, white text; hover `accent-600` | The one main action per screen |
| **Secondary** | White bg, `1px --color-border`, `--color-foreground`; hover `--color-hairline` fill | Cancel, back, secondary |
| **Tertiary** | Text only, `accent-500`, no bg | Light links (edit, view more) |
| **Destructive** | Text `danger` (inline) · solid `danger` bg (confirm-delete only) | Delete, cancel permanently |

Disabled: 40% opacity, no press-scale.

### Inputs (outlined)

- White bg, `1px --color-border`, radius `md` (12px), min-height 44px, text 16px
  (prevents mobile zoom).
- **Label above** the field, 13px `--color-muted` (no floating labels).
- Placeholder: `--color-faint`.
- **Focus (global standard):** border → `accent-500` + ring
  `0 0 0 3px rgba(10,126,164,.15)`.
- **Error:** border `danger` + helper text `danger` below + warning icon.

### Cards

White, radius `lg` (18px), `--shadow-sm`, padding 20–24px. No border. Hover (if
interactive): lift to `--shadow-md`, `active:scale-[0.99]`.

### Navigation

- **Bottom tab bar** — floating glass pill (keep current pill shape), 4 tabs.
  Active: icon + label `accent-500`, heavier icon stroke (2). Inactive:
  `--color-muted`, stroke 1.75. Glass recipe §3. Respect
  `env(safe-area-inset-bottom)`.
- **Top bar** — glass (§3), sticky, page title + back + optional action.
- Tabs: **หน้าหลัก** (`/dashboard`) · **คำร้อง** (`/requests`) · **คลังอุปกรณ์**
  (`/inventory`) · **รายงาน** (`/reports`). "New request" / "New item" are
  **primary buttons inside** their section, not tabs.

### Modals / sheets / toasts

- **Bottom sheet** = default on mobile for actions & short forms: slides up, grabber
  handle on top, radius `xl` top corners, opaque `--color-surface`.
- **Center dialog** = short confirmations only (e.g. "ยืนยันลบ?").
- **Modal/sheet body:** opaque when it holds a form/dense content; glass only for
  light menus.
- **Backdrop:** `rgba(0,0,0,0.4)` + `blur(4px)`.
- **Toast:** glass capsule from top, semantic dot/icon leading, auto-dismiss ~3–4s.

### Lists

Row anatomy: `[leading icon/avatar] [Title · Meta] [status badge] [chevron ›]`

- **Title** (primary): 15–16px semibold `--color-foreground`.
- **Meta** (secondary): 13px `--color-muted`.
- **Status**: soft-bg semantic **badge** (pill), radius `full` or `sm`.
- **Chevron** trailing = navigable.
- Rows: white, `--shadow-sm`, radius `lg`, `active:scale-[0.99]`.

### States

- **Empty:** centered — muted lucide outline icon + short title + one-line hint +
  primary action (e.g. "เพิ่มผู้ป่วยคนแรก").
- **Loading:** **skeleton** shimmer (gray blocks) for lists/cards; spinner only
  inside buttons on submit.

---

## 9. Iconography

- **lucide-react**, outline style, whole app. **No emoji as UI icons. No filled
  icon sets mixed in.**
- **Stroke:** `1.75` default · `2` for active/emphasis (e.g. selected tab).
- **Sizes:** `16` (inline, meta, badge) · `20` (buttons, list rows, general) ·
  `24` (page headers, nav).
- **Color:** inherits surrounding text — `--color-muted` (secondary),
  `accent-500` (active/link), semantic (status).

---

## 10. Accessibility

- Body/UI text on white meets AA; `--color-foreground` on glass ≥ 82% white meets AA.
- **Focus ring is mandatory & uniform** (see Inputs): `accent-500` border +
  `0 0 0 3px rgba(10,126,164,.15)` on every interactive element (inputs, buttons,
  links, tabs). Never remove outline without replacing it.
- Touch targets ≥ 44×44px.
- Status is never color-only — always paired with a text label and/or icon.
- Respect `prefers-reduced-motion` (§7).

---

## 11. Token encoding (Tailwind v4 — paste into `app/globals.css`)

This project uses Tailwind v4 CSS-first config (`@theme`, no `tailwind.config`).
These generate utilities like `bg-accent-500`, `text-secondary`, `rounded-lg`,
`shadow-md`.

> **This block is already applied in `app/globals.css`.** Reproduced here as the
> reference. Utilities: `bg-canvas`, `text-muted`, `bg-accent-500`, etc.

```css
@theme {
  /* neutrals */
  --color-canvas: #F5F5F7;
  --color-surface: #FFFFFF;
  --color-surface-2: #FBFBFD;
  --color-foreground: #1D1D1F;
  --color-muted: #6E6E73;
  --color-faint: #A1A1A6;
  --color-border: #D2D2D7;
  --color-hairline: #E8E8ED;

  /* accent — trust blue-teal */
  --color-accent-50:  #EAF6FA;
  --color-accent-100: #D0EAF2;
  --color-accent-200: #A6D7E6;
  --color-accent-300: #6FBBD3;
  --color-accent-400: #3699BC;
  --color-accent-500: #0A7EA4;
  --color-accent-600: #086A8C;
  --color-accent-700: #075670;
  --color-accent-800: #084457;
  --color-accent-900: #0A3846;

  /* semantic */
  --color-success:      #1C8E5A;
  --color-success-soft: #E6F5EC;
  --color-success-text: #12703F;
  --color-warning:      #C77A0A;
  --color-warning-soft: #FDF1DD;
  --color-warning-text: #8A5406;
  --color-danger:       #C9362B;
  --color-danger-soft:  #FBE9E7;
  --color-danger-text:  #98261D;
  --color-info:         #5B5BD6;
  --color-info-soft:    #ECECFB;
  --color-info-text:    #3A3A9E;

  /* radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  /* shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04);
  --shadow-lg: 0 12px 32px rgba(0,0,0,.10), 0 4px 8px rgba(0,0,0,.05);
  --shadow-xl: 0 24px 64px rgba(0,0,0,.16);

  /* motion */
  --ease-apple: cubic-bezier(.32,.72,0,1);
}

/* glass utility (floating layers only) */
.glass {
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: rgba(255,255,255,.96); }
}
```

> Note: a `prefers-color-scheme: dark` block currently exists in `globals.css`.
> Since Phase 1 is light-only, neutralize it (or scope tokens to `:root`) so the OS
> dark setting does not partially re-theme the app.
