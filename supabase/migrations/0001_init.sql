-- DK CourtFest — core schema (Phase 0)
-- Run in the Supabase SQL editor, or via `supabase db push` with the CLI.
-- Money is stored in whole XOF (FCFA has no minor unit).

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
create type division          as enum ('3x3', '5x5');
create type contact_type      as enum ('sponsor', 'partner', 'media', 'volunteer', 'vip');
create type ticket_type       as enum ('general', 'vip', 'player', 'staff');
create type ticket_status     as enum ('valid', 'used', 'void');
create type payment_provider  as enum ('wave', 'orange_money', 'cinetpay', 'card', 'cash');
create type payment_status    as enum ('pending', 'paid', 'failed', 'refunded');
create type team_status       as enum ('pending', 'confirmed', 'waitlist', 'withdrawn');
create type match_status      as enum ('scheduled', 'live', 'final', 'cancelled');

-- ── Editions (supports a new event every season) ─────────────────────────────
create table editions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  season     text not null default '2026/2027',
  event_date date,
  venue      text,
  status     text not null default 'planning',  -- planning | open | live | closed
  created_at timestamptz not null default now()
);

-- ── Teams & players ──────────────────────────────────────────────────────────
create table teams (
  id            uuid primary key default gen_random_uuid(),
  edition_id    uuid not null references editions(id) on delete cascade,
  name          text not null,
  division      division not null,
  category      text,
  captain_name  text not null,
  captain_phone text not null,
  captain_email text,
  status        team_status not null default 'pending',
  created_at    timestamptz not null default now()
);

create table players (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  dob           date,
  jersey_no     int,
  position      text,
  phone         text,
  photo_url     text,
  waiver_signed boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── CRM: sponsors, partners, media, volunteers, VIPs ─────────────────────────
create table contacts (
  id         uuid primary key default gen_random_uuid(),
  type       contact_type not null,
  org_name   text,
  full_name  text not null,
  email      text,
  phone      text,
  notes      text,
  created_at timestamptz not null default now()
);

-- ── Ticketing & attendance ───────────────────────────────────────────────────
create table tickets (
  id          uuid primary key default gen_random_uuid(),
  edition_id  uuid not null references editions(id) on delete cascade,
  holder_name text not null,
  phone       text,
  type        ticket_type not null default 'general',
  price_xof   int not null default 0,
  qr_token    text not null unique default encode(gen_random_bytes(16), 'hex'),
  status      ticket_status not null default 'valid',
  issued_at   timestamptz not null default now()
);

-- Append-only scan log. `synced` lets the offline check-in PWA reconcile later.
create table check_ins (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  gate       text,
  device_id  text,
  synced     boolean not null default true
);

-- ── Money in: entry fees + sponsorship (feeds the SYSCOHADA ledger) ──────────
create table sponsors (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null references editions(id) on delete cascade,
  contact_id   uuid references contacts(id) on delete set null,
  tier         text,                              -- title | gold | silver | partner
  amount_xof   int not null default 0,
  deliverables jsonb not null default '[]'::jsonb,
  status       text not null default 'prospect',  -- prospect | committed | paid
  created_at   timestamptz not null default now()
);

create table payments (
  id         uuid primary key default gen_random_uuid(),
  edition_id uuid not null references editions(id) on delete cascade,
  provider   payment_provider not null,
  amount_xof int not null,
  ref        text,
  status     payment_status not null default 'pending',
  ticket_id  uuid references tickets(id)  on delete set null,
  sponsor_id uuid references sponsors(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Tournament ops → feeds the broadcast overlays ────────────────────────────
create table matches (
  id           uuid primary key default gen_random_uuid(),
  edition_id   uuid not null references editions(id) on delete cascade,
  division     division not null,
  round        text,
  team_a       text,
  team_b       text,
  score_a      int not null default 0,
  score_b      int not null default 0,
  court        text,
  scheduled_at timestamptz,
  status       match_status not null default 'scheduled'
);

-- ── Staff (check-in app login by phone + pin) ────────────────────────────────
create table staff (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  role       text,
  phone      text,
  pin        text,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index on teams (edition_id);
create index on players (team_id);
create index on tickets (edition_id);
create index on check_ins (ticket_id);
create index on payments (edition_id);
create index on sponsors (edition_id);
create index on matches (edition_id);
