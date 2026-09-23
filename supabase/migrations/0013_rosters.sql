-- DK CourtFest - rosters: individual players registered for an edition, by
-- category, outside the site's team registration (WhatsApp community groups,
-- manual entries by the admin). One row per player and category; a player who
-- joins two categories has two rows.
-- Applied to the Supabase project on 2026-09-23 (migration "rosters").
-- Idempotent: safe to re-run.

alter type contact_type add value if not exists 'player';

create table if not exists rosters (
  id             uuid primary key default gen_random_uuid(),
  edition_id     uuid not null references editions(id) on delete cascade,
  category       text not null check (category in ('elite_men', 'elite_women', 'veterans', 'youth', 'open')),
  full_name      text not null,
  whatsapp_name  text,                                   -- display name in the WhatsApp group
  phone          text,
  source         text not null default 'whatsapp' check (source in ('whatsapp', 'site', 'manual')),
  whatsapp_group text,                                   -- group the player joined
  status         text not null default 'registered' check (status in ('registered', 'confirmed', 'withdrawn')),
  contact_id     uuid references contacts(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  unique (edition_id, category, full_name)
);

create index if not exists rosters_edition_idx on rosters (edition_id);

alter table rosters enable row level security;

-- Admin (any signed-in user) full access, same model as the other tables.
drop policy if exists "admin all rosters" on rosters;
create policy "admin all rosters" on rosters
  for all to authenticated using (true) with check (true);
