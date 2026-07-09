# QA Bug Report — Medical Equipment Lending PWA

**Date:** 2026-06-21
**Build:** Next.js 16.2.9 (Turbopack) · Prisma 7.8.0 · Node 22
**Method:** Headless browser sweep (agent-browser CLI, mobile 390×844 + desktop 1280×800) over all routes, both roles.
**Server:** http://localhost:8888
**Accounts:** `admin@med-borrow.local` (ADMIN) · `staff@med-borrow.local` (STAFF)

---

## Summary

| # | Severity | Area | Status |
|---|----------|------|--------|
| 0a | 🔴 Critical | Prisma 7 runtime — no driver adapter, DB dead | ✅ Fixed in session |
| 0b | 🔴 Critical | `leaflet.heat` missing dep — every route 500 | ✅ Fixed in session |
| 1 | 🟠 High (code) | Request detail/approve/return 500 — `getNextBorrowWorkflowStatuses` no fallback | Open |
| 2 | 🟠 High (data) | DB request rows store English status codes, not Thai labels — **other dev's seed** | Open |
| 3 | 🟠 High | AI recommend: invalid OpenRouter model ID → 500 | Open |
| 4 | 🟠 High | AI endpoint returns 500 on client validation error (should be 400) | Open |
| 5 | 🟠 High | No server-side Zod validation on patient creation | Open |
| 6 | 🟡 Medium | RBAC gap — approve route + others reachable by STAFF | Open |
| 7 | 🟡 Medium | Bottom nav overlaps form "Next" button — tap hijacked | Open |
| 8 | 🟡 Medium | `/requests` list shows English status/equipment (same data root as #2) | Open |
| 9 | 🟡 Medium | PWA not wired (no manifest link, no SW, icons 404) | Open |
| 10 | 🔵 Low | No logout control in UI | Open |
| 11 | 🔵 Low | 404 page not localized (English Next default) | Open |
| 12 | 🔵 Low | Thai address dataset truncated (10 of 77 provinces) | Open |

**Login:** both roles authenticate, redirect to `/dashboard`, wrong password rejected with Thai error, unauth → 307 to `/login`. ✅
**Integrations:** `.env` has real keys for all (OpenRouter, Cloudinary, LINE, DB). Findings below are real breakage, **not** missing-key degradation. Nominatim geocoding works live.
**Thai rendering:** perfect everywhere — no mojibake; Buddhist-era dates correct (1 มิถุนายน 2569 = 2026). No hydration / React-key / unhandled-rejection warnings.

---

## Fixed during this session

### 0a — 🔴 Prisma 7 runtime had no driver adapter (DB completely dead)
- **Symptom:** runtime crash `Cannot find module '.prisma/client/default'`, then `PrismaClientInitializationError: requires either "adapter" or "accelerateUrl"`. Every DB query failed — login, seed, all reads.
- **Cause:** Prisma 7 breaking change — the default `client` engine **requires a driver adapter**. `prisma.config.ts` `datasource.url` is CLI-only; the runtime `PrismaClient` never reads it. `new PrismaClient()` had no way to connect.
- **Fix applied:** installed `@prisma/adapter-pg` + `pg` (+ `@types/pg`); wired `lib/db.ts` and `prisma/seed.mjs` to `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`. Chose `adapter-pg` over `adapter-neon` because the project uses **local Postgres in dev + Neon in cloud** — pg adapter works both; neon adapter would break local.
- **Verified:** queries work; DB has 2 users + 58 reference values.

### 0b — 🔴 `leaflet.heat` missing dependency (global compile failure)
- **Symptom:** at test start **every** route returned 500 with Next "Build Error: Module not found: Can't resolve 'leaflet.heat'" — including `/login` and `/api/auth/providers`.
- **Cause:** `components/maps/LeafletHeatMap.tsx:19` does `await import("leaflet.heat" as string)`. The `as string` cast tries to dodge static analysis, but Turbopack still resolves it at build time and fails. Package was never in `package.json` / `node_modules`.
- **Fix applied:** `npm install leaflet.heat` (now `^0.2.0`) + `@types/leaflet.heat`.
- **Verified:** all routes compile; dashboard heatmap renders with OSM tiles, no console errors.

---

## Open findings

### 1 — 🟠 High (code) · Request detail/approve/return pages 500 on unknown status
- **Routes:** `/requests/[requestId]`, `/approve`, `/return` — entire borrow workflow unreachable.
- **Symptom:** every request detail page → **HTTP 500**, `TypeError: Cannot read properties of undefined (reading 'filter')`.
- **Evidence:** `app/(app)/requests/[requestId]/page.tsx:54` does `nextStatuses.filter(...)`; `nextStatuses` came from `getNextBorrowWorkflowStatuses(currentStatus)` at `:44`, which returned `undefined`.
- **Cause:** `lib/domain/transitions.ts:38` `return BORROW_WORKFLOW_TRANSITIONS[status]` — **no fallback**, returns `undefined` for any key not in the (Thai) map. `page.tsx:43` blind-casts `request.workflowStatus as BorrowWorkflowStatus` without validating. Triggered here by the bad data in #2, but it would crash on **any** unexpected/legacy status string.
- **Fix (code, safe to apply now):**
  - `getNextBorrowWorkflowStatuses` → `return BORROW_WORKFLOW_TRANSITIONS[status] ?? []`.
  - Same defensive guard in `canTransitionBorrowWorkflowStatus` (`BORROW_WORKFLOW_TRANSITIONS[fromStatus]?.includes(...)`) and `getNextEquipmentStatuses`/`canTransitionEquipmentStatus`.
  - In the detail page, treat an unrecognized stored status as an error/empty state rather than crashing.
  - This makes pages robust but does **not** by itself make the seeded English rows display correctly — that needs #2.

### 2 — 🟠 High (data) · DB request rows use English status codes, not the app's Thai labels
- **Source:** the **other developer's seed** on the shared DB (NOT this app, NOT `prisma/seed.mjs` — that file only seeds the `referenceValue` table and creates no requests).
- **Evidence (live DB query):** all 8 `BorrowingRequest` rows store English `workflowStatus` (`received`, `ai_recommended`, `inventory_check`, `approved`, `preparing_delivery`, `delivered`, `awaiting_return`, `closed`) and English `requestedEquipmentType` (`wheelchair`, `walker`, `bed`, `air_mattress`, `cane`). These are the reference-table **codes**, not the Thai **labels**.
- **The app is internally consistent in Thai** (canonical per `AGENTS.md` → `plan/01`): writers all use Thai — `create-patient.ts:101` `"รับคำร้อง"`, `approve-request.ts:22` `"อนุมัติ"`, `reject-request.ts:13` `"ไม่อนุมัติ"`, `process-return.ts:55` `"คืนอุปกรณ์"`; `transitions.ts` + `constants.ts` + schema type are all Thai.
- **Consequences:** detail/approve/return 500 (via #1); `/requests` list shows raw English badges (#8); approve guard `page.tsx` checks `currentStatus === "ตรวจสอบคลังอุปกรณ์"` but stored value is `inventory_check` → never matches → always redirects to the crashing detail page. Approve & return flows **100% unreachable**.
- **Fix (DATA — needs coordination, do NOT do unilaterally):** re-seed the `BorrowingRequest` rows with the Thai label vocabulary from `lib/domain/constants.ts`. **Shared DB — the other dev owns this seed data; coordinate before rewriting.** Alternatively agree as a team to switch the whole domain to English codes (larger change across `transitions.ts`, guards, badges, queries).

### 3 — 🟠 High · AI recommendation broken (invalid model ID)
- **Route:** `/api/ai/recommend` (patient wizard step 5 "AI แนะนำ").
- **Symptom:** every valid request → **HTTP 500**.
- **Evidence:** live call → `OpenRouter 400: "google/gemini-2.0-flash is not a valid model ID"`.
- **Cause:** `lib/integrations/openrouter/ai-client.ts:3` hardcodes `model = "google/gemini-2.0-flash"`, which OpenRouter rejects. Needs a valid slug, e.g. `google/gemini-2.0-flash-001`. No fallback — `route.ts:20` catches everything → 500.
- **Impact:** AI feature never works. Staff can still pick equipment manually, so workflow isn't fully blocked.
- **Fix:** use a valid OpenRouter model slug; add a graceful fallback so AI failure returns a "manual selection" state, not a 500. (Note: `AGENTS.md` lists the model as `google/gemini-2.0-flash` — update spec + code together.)

### 4 — 🟠 High · AI endpoint 500s on client validation errors
- **Route:** `/api/ai/recommend`.
- **Symptom:** malformed body → **HTTP 500** (should be **400**).
- **Cause:** `route.ts` wraps Zod parse + AI call in one `try/catch` → all errors collapse to 500.
- **Fix:** parse/validate first and return 400 on Zod failure; reserve 500 for the AI call.

### 5 — 🟠 High · No server-side validation on patient creation
- **Path:** `createPatient` server action (`lib/actions/patients/create-patient.ts`).
- **Symptom:** action writes straight to DB **without** running `patientSchema`. Validation is client-only (RHF regex in `PatientIntakeWizard.tsx`).
- **Impact:** a direct server-action invocation bypasses the **13-digit nationalId** / **10-digit Thai mobile** checks — data-integrity / defense-in-depth gap. (Via the UI, client validation **does** correctly reject bad input — verified live.)
- **Fix:** `patientSchema.parse()` (shared client/server Zod schema) inside the server action before any DB write. This is an explicit `AGENTS.md` rule ("Validate all external input with Zod").

### 6 — 🟡 Medium · RBAC gap (admin gating incomplete)
- **Symptom:** only `/inventory/new` enforces `requireAdmin`. As STAFF:
  - `/inventory/new` → redirected to `/dashboard` ✅ (correct block)
  - `/inventory`, `/inventory/[itemId]`, `/reports` → **reachable** by STAFF
  - `/requests/[id]/approve` → **not redirected**, reaches route then 404s
- **Cause:** `requireAdmin` only on `inventory/new/page.tsx:7`. The approve page **and `approveRequest` server action** have no role check. A staff-reachable approval route contradicts the "admin approval" intent.
- **Fix:** add `requireAdmin` to the approve page **and** a role check inside `approveRequest`. Whether `/inventory` list & `/reports` should be admin-only is a **product decision** — confirm intended access matrix.

### 7 — 🟡 Medium · Bottom nav overlaps form "Next" button (tap hijacked)
- **Route:** `/patients/new` (likely all wizard steps).
- **Symptom:** tapping "ถัดไป" (Next) navigates to `/inventory` instead of advancing — the fixed bottom tab-bar's "คลัง" link sits **on top of** the Next button.
- **Evidence:** geometry overlap — mobile: Next `top780 bottom828 left195 right359` vs inventory nav-link `top780 bottom844 left225 right300`. **Persists at desktop** (Next `top736-784` vs nav `top736-800`). Clicking the button directly via JS advances correctly → button logic is fine; the nav overlay steals the tap.
- **Fix:** add bottom padding/safe-area to the wizard footer (or `z-index` / layout so the nav doesn't overlap the primary action). High user impact — Next is unusable by tapping its center.

### 8 — 🟡 Medium · `/requests` list not localized (English status + equipment)
- **Route:** `/requests`.
- **Symptom:** list rows show raw English `workflowStatus` badges and English `requestedEquipmentType`; the status filter dropdown uses Thai → rows and filter don't match.
- **Cause:** same data root as #2 (English codes stored where Thai labels expected). No code bug in the list itself.
- **Fix:** resolved once #2 data is corrected. (Optionally add a code→label display map as a safety net.)

### 9 — 🟡 Medium · PWA not wired up
- **Symptom:** described as a PWA but: no `<link rel="manifest">` in `<head>` (a `manifest.json` exists in `public/` but is never referenced); `/sw.js` 404 (no service worker); PWA icons 404 (192px). `public/` holds only Next.js starter SVGs.
- **Fix:** reference the manifest in the root layout, add icons (192/512), register a service worker. No offline/installable support until then.

### 10 — 🔵 Low · No logout control in UI
- **Symptom:** no signout button on dashboard or nav; had to hit `/api/auth/signout` manually.
- **Fix:** add a logout action to the nav/header.

### 11 — 🔵 Low · 404 page not localized
- **Symptom:** unknown routes show default Next English "404 / This page could not be found." Seen on `/requests/fake-id/approve` & `/return`.
- **Fix:** add a Thai `app/not-found.tsx`.

### 12 — 🔵 Low · Thai address dataset truncated
- **Route:** `/patients/new` step 2.
- **Symptom:** province dropdown has **10 of 77** provinces (`data/thai-address.json` is a sample). Cascade works correctly for included provinces.
- **Fix:** load the full province/district/subdistrict/zip dataset.

---

## Notes (not bugs)
- **`/reports`** has **no** recharts and **no** heatmap — it's a plain inventory-by-type table + LINE notification list. The heatmap lives on `/dashboard`. (Brief/expectation mismatch only.)
- Geocoded reverse-lookup result is only `console.log`ged, not shown in a field (`LeafletMapPicker`); pin lat/lng **is** captured. Geocoding has a silent try/catch fallback (good).

## Pass list (worked, no issues)
- `/login` (mobile+desktop), wrong-pw rejection, both-role login, redirects.
- `/dashboard` (post-fix): stat cards, empty-states, Leaflet heatmap with OSM tiles, no console errors.
- `/patients` empty-state + search + add.
- `/patients/new` **client validation solid**: bad nationalId → "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"; bad phone → "เบอร์โทรศัพท์ต้องเป็นเบอร์มือถือไทยที่ถูกต้อง"; missing DOB blocked; valid input advances. Address cascade works; `/api/address` 200; map reverse-geocodes via Nominatim (live 200).
- `/inventory` filters + empty-state; `/inventory/new` (ADMIN) create end-to-end → detail; `/inventory/[itemId]` detail with status badge + Buddhist-era dates + status-history empty-state.
- `/requests` empty-state + filters; `/reports` table reflects created item + LINE history empty-state.

## Test artifacts / cleanup
- **Left in DB:** 1 inventory item `TEST-ITEM-001 / ASSET-99999` (wheelchair, id `cmqnt2yf10000gwfl5j3vla16`). Delete for a clean slate. No patient rows created.
- **Screenshots:** `E:\med-borrow-nd\med-borrow\.claude\tmp-screenshots\` (`01-login.png` … `19-desktop-patient-new.png`).
