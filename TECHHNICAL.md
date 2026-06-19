# Technical Stack

Medical Equipment Lending Application — Phase 1.

Goal: mobile-first, low-cost, **no credit card / no paid tier required** to build and demo.

---

## 1. Overview

A single **Next.js** project serves both the mobile-first PWA frontend and the backend API. Data lives in **PostgreSQL** accessed through **Prisma**. AI recommendations go through **OpenRouter** (Gemini as primary model). Maps and notifications use only free, no-card services.

```
[ PWA (Next.js, mobile browser) ]
            |
   Route Handlers / Server Actions
            |
   Prisma  ->  PostgreSQL (Neon)
            |
   +--------+----------+-----------+
   |        |          |           |
OpenRouter  Cloudinary  LINE      Leaflet/OSM
(Gemini AI) (images)   Messaging  (maps, client)
                        API (push)
```

---

## 2. Frontend

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | RSC + Server Actions; one repo for UI + API |
| App type | **PWA** | `manifest.json` + service worker; installable on Android/iOS, no app store |
| Styling | **Tailwind CSS** + **shadcn/ui** | Mobile-first, accessible components |
| Forms / validation | **React Hook Form** + **Zod** | National ID = 13 digits, phone = 10 digits enforced both client + server |
| Data fetching | RSC + Server Actions (TanStack Query if client caching needed) | |
| Charts | **Recharts** (or Tremor) | Dashboard metrics |
| Camera / GPS | Browser APIs | `<input capture>` for photos, `navigator.geolocation` for GPS pin |

PWA design principle: checklist-driven input, minimal typing, usable by low-tech staff.

---

## 3. Backend

| Concern | Choice | Notes |
|---|---|---|
| API layer | **Next.js Route Handlers + Server Actions** | No separate server |
| ORM | **Prisma** | Typed schema; models per `01-product-scope-and-domain-model.md` |
| Database | **PostgreSQL** | **Neon** free serverless tier (no credit card) for cloud; local Postgres/Docker for dev |
| Auth | **Auth.js (NextAuth)** — credentials | Staff / admin login; role field gates admin dashboard |
| Validation | **Zod** | Shared schemas, single source of truth |

Inventory is tracked **per serialized item** (unique item ID + asset number), never by aggregate count only. Status transitions are explicit and recorded in a status-history table.

---

## 4. AI Recommendation Engine

| Concern | Choice |
|---|---|
| Gateway | **OpenRouter** (one API key, many models, free-tier models available) |
| Primary model | **Gemini** (e.g. `google/gemini-2.0-flash`) |
| Fallback | secondary OpenRouter model if primary errors / rate-limits |
| Call site | server-side Route Handler (key never exposed to client) |

Phase 1 input is **text/checklist only** (age, gender, conditions, mobility, self-care, urgency). Output = ranked equipment with suitability % (see PRD table). **AI is decision support; staff make the final call.** Image analysis is Phase 2.

---

## 5. Integrations (all free, no credit card)

| Need | Choice | Why |
|---|---|---|
| Maps + pin | **Leaflet + react-leaflet**, OSM tiles | No billing key (Google Maps requires a card) |
| Geocoding | **Nominatim (OSM)** | Free reverse/forward geocode |
| Heat map | **Leaflet.heat** | Patient density / delivery hotspots |
| Maps link | Store `lat`, `lng`, + a `google.com/maps` URL string | Link capture needs no API |
| Thai address dropdowns | Static **province/district/subdistrict/zip JSON** dataset | Offline, free, fast cascading dropdowns |
| Image storage | **Cloudinary** free tier | Assessment + return-condition photos; no card |
| Notifications | **LINE Messaging API** (push) | Free tier, no card. One-way alerts. (LINE Notify retired 2025) |

LINE flow: capture `userId` via webhook on follow/link, then push status updates (request sent, approved/rejected, preparing, delivered, due soon, returned).

---

## 6. Hosting & Tooling

| Concern | Choice |
|---|---|
| Hosting | **Vercel** (free Hobby tier, no card) |
| DB host | **Neon** free tier |
| Env management | `.env` + `.env.example`; secrets never committed |
| Lint / format | ESLint + Prettier |
| Package manager | npm (or pnpm) |

---

## 7. Stack Summary

- **Frontend:** Next.js PWA, TypeScript, Tailwind, shadcn/ui, RHF + Zod
- **Backend:** Next.js Route Handlers, Prisma, PostgreSQL (Neon), Auth.js
- **AI:** OpenRouter → Gemini (text/checklist, Phase 1)
- **Maps:** Leaflet + OSM + Nominatim + Leaflet.heat
- **Media:** Cloudinary (free)
- **Notifications:** LINE Messaging API (push, free)
- **Hosting:** Vercel (free)

Everything above runs on free tiers with no credit card required.
