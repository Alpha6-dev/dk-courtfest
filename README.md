# DK CourtFest — Event Platform

> Dakar · Basket · Culture. Registration, CRM, ticketing & check-in for the DK CourtFest street basketball event (Place de l'Indépendance, **08·06·2026**).

Part of the **Alpha 6 / Tech 6** stack: **React 19 + Vite + Tailwind 4 + TypeScript**, with **Supabase** (Postgres) as the database backbone. Built to the [DK CourtFest Graphic Chart V1.0](https://dkcourtfest.com).

## Status (Phases 0–2 + Phase 3 starter)

| Area | Status |
|------|--------|
| Database schema (10 tables, enums, RLS) | ✅ `supabase/migrations` |
| Public landing page (branded) | ✅ `/` |
| Team + player registration (3×3 / 5×5), secure `register_team` RPC | ✅ `/register` |
| Admin magic-link login | ✅ `/admin` |
| Admin dashboard (live counts incl. attendance) | ✅ `/admin` |
| Admin teams list + status workflow | ✅ `/admin/teams` |
| Admin contacts / CRM | ✅ `/admin/contacts` |
| Ticketing — issue, QR, public ticket page, WhatsApp share | ✅ `/admin/tickets` |
| Check-in — manual + camera scan, live headcount | ✅ `/admin/checkin` |
| **Offline-first check-in PWA** (local ticket cache + queued sync, installable) | ✅ |
| Mobile-money payments (Wave/Orange Money via CinetPay/PayDunya) | 🟡 scaffold — see [PAYMENTS.md](./PAYMENTS.md) |

**Next:** tournament brackets + broadcast overlays, analytics + SYSCOHADA ledger export.

### Offline check-in (PWA)
Installable web app (Add to Home Screen). Staff **sync the ticket manifest once online**, then the scanner validates QR codes **entirely on-device** (IndexedDB) and queues each scan; queued check-ins flush to Supabase via the idempotent `sync_check_ins` RPC when the connection returns. Built for the patchy signal at Place de l'Indépendance.

## Setup

```bash
npm install
cp .env.example .env      # paste VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

### Database
Run the migrations in order in the Supabase SQL editor (or `supabase db push`), then the seed:
1. `0001_init.sql` — tables, enums, indexes
2. `0002_rls.sql` — Row-Level Security
3. `0003_register_rpc.sql` — public registration function
4. `0004_tickets_rpc.sql` — ticket view + check-in functions
5. `seed.sql` — Vol. 01 edition

> Admin login: magic link via Supabase Auth (Email provider). Add yourself under **Authentication → Users** for the first sign-in.

## Routes
- `/` landing · `/register` team registration · `/ticket/:token` public ticket
- `/admin` dashboard · `/admin/teams` · `/admin/tickets` · `/admin/checkin` · `/admin/contacts`

## Project layout
```
supabase/migrations/   SQL schema + RLS + RPCs  ← the "database to work with"
supabase/functions/    payment-init + payment-webhook (Edge Function scaffold)
supabase/seed.sql      first edition row
src/lib/               supabase client, active-edition resolver
src/types/db.ts        TS types mirroring the schema
src/pages/             Home, Register, Ticket, admin/*
src/components/        Wordmark, QR
```

## Data model
`editions · teams · players · contacts · tickets · check_ins · sponsors · payments · matches · staff`
Attendance = `tickets` + `check_ins`. Security: the public only touches `register_team` / `get_ticket` RPCs; everything else is admin-only via RLS.

## Brand
From the Graphic Chart V1.0 (`src/index.css` `@theme`): Court Onyx `#0A0A0C` · Dakar Flame `#FF5C00` · Téranga Sun `#FFB800` · Lion Green `#00C853` · Bone White `#F5F0E8`. Display: Bebas Neue · Body: Barlow Condensed · Mono: JetBrains Mono.

---
© Alpha 6 Organization · Mouhamadou Lamine Diop · confidential
