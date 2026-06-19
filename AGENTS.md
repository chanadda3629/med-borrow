# AGENTS.md

Guidance for coding agents (Codex, Claude, etc.) working in this repo.

## Project

Medical Equipment Lending Application — mobile-first PWA for a palliative care center. Staff register patients, assess needs, get AI equipment recommendations, manage serialized inventory, run the borrow→deliver→return workflow, and send LINE notifications. Thai-language UI.

Authoritative docs (read before coding):
- `PRD.md` — product requirements (Thai)
- `FEATURES.md` — feature list
- `TECHNICAL.md` — tech stack and rationale
- `plan/00-index.md` — implementation slices + build order
- `plan/01-product-scope.md` — entities, status vocabulary, domain rules

> Status: planning stage. Repo not yet scaffolded — no `package.json` yet. First code task is to scaffold per `TECHNICAL.md`.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript, PWA, Tailwind CSS, shadcn/ui
- **Forms/validation:** React Hook Form + Zod (shared client/server schemas)
- **Backend:** Next.js Route Handlers + Server Actions
- **ORM/DB:** Prisma + PostgreSQL (Neon free tier in cloud, local Postgres in dev)
- **Auth:** Auth.js (NextAuth), credentials, role-gated admin
- **AI:** OpenRouter gateway → Gemini primary (`google/gemini-2.0-flash`), server-side only
- **Maps:** Leaflet + react-leaflet + OSM tiles + Nominatim geocoding + Leaflet.heat
- **Media:** Cloudinary (free tier)
- **Notifications:** LINE Messaging API (one-way push)
- **Hosting:** Vercel (free)

Constraint: every dependency must run on a **free tier with no credit card**. Do not introduce Google Maps Platform, paid DB tiers, or any card-required service without asking.

## Commands

> Fill in after scaffolding. Expected:

```bash
npm install
npm run dev          # local dev server
npm run build        # production build — DO NOT run unless explicitly requested
npm run lint         # ESLint
npx tsc --noEmit     # type check
npx prisma migrate dev   # apply DB migrations in dev
npx prisma generate      # regen client after schema change
npx prisma studio        # inspect DB
```

## Workflow (required before completing a task)

1. **Type check** — `npx tsc --noEmit`
2. **Lint** — `npm run lint`
3. **Test** — run relevant tests
4. Keep commits small and descriptive.

Do not run `npm run build` / `next build` unless explicitly asked.

## Conventions

- TypeScript strict. No `any` unless justified.
- Validate all external input with Zod. Enforce: **national ID = 13 numeric digits**, **phone = 10 numeric digits**.
- Default to React Server Components; use Server Actions for mutations. Mark client components explicitly.
- Inventory is tracked **per serialized item** (unique item ID + asset number) — never by aggregate count only.
- Borrow workflow status transitions are **explicit and ordered**; cannot skip steps. Record every change in a status-history table. Use the exact status strings in `plan/01-product-scope-and-domain-model.md`.
- AI output is **decision support only** — staff are the final approver. Never auto-approve from AI.
- Phase 1 = text/checklist input only. No automated image analysis (that is Phase 2).
- External integrations (AI, LINE, Cloudinary, geocoding) must have failure/fallback states.

## Security

- Never commit `.env` or secrets. Keep `.env.example` current.
- All API keys (OpenRouter, Cloudinary, LINE, DB URL) are server-side only — never exposed to the client bundle.
- Never log secrets or patient PII.

## Structure (target, post-scaffold)

```
app/            # Next.js routes (App Router)
  api/          # Route Handlers (AI, LINE webhook, uploads)
components/     # UI (shadcn/ui based)
lib/            # db (prisma), validation (zod), integrations
prisma/         # schema.prisma + migrations
data/           # static Thai address dataset (province/district/subdistrict/zip)
public/         # PWA manifest, icons, service worker
plan/           # implementation slices (source of truth for scope)
```

