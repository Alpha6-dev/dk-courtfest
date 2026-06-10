-- Alpha 6 Sports — DK Academy vertical (training for categories U10…Open/Femmes).
-- Shares the same Supabase backend as DK CourtFest. Ongoing (not edition-bound).

create type program_type      as enum ('academy_term', 'camp', 'clinic');
create type enrollment_status as enum ('pending', 'active', 'cancelled');
create type membership_status as enum ('due', 'paid', 'past_due');

create table categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,                 -- U10, U12, U16, Open, Femmes
  age_min         int,
  age_max         int,
  schedule        text,                          -- "Mar/Jeu 17h-19h"
  monthly_fee_xof int not null default 15000,
  sort            int not null default 0,
  active          boolean not null default true
);

create table coaches (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text,
  email      text,
  bio        text,
  created_at timestamptz not null default now()
);

create table programs (
  id          uuid primary key default gen_random_uuid(),
  type        program_type not null default 'academy_term',
  name        text not null,
  description text,
  price_xof   int not null default 0,
  starts_on   date,
  ends_on     date,
  active      boolean not null default true
);

create table athletes (
  id             uuid primary key default gen_random_uuid(),
  first_name     text not null,
  last_name      text not null,
  dob            date,
  category_id    uuid references categories(id) on delete set null,
  guardian_name  text,
  guardian_phone text,
  guardian_email text,
  medical_notes  text,
  photo_url      text,
  waiver_signed  boolean not null default false,
  created_at     timestamptz not null default now()
);

create table enrollments (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid not null references athletes(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  program_id  uuid references programs(id) on delete set null,
  status      enrollment_status not null default 'pending',
  created_at  timestamptz not null default now()
);

create table memberships (
  id         uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references athletes(id) on delete cascade,
  period     text not null,                       -- '2026-09'
  amount_xof int not null,
  status     membership_status not null default 'due',
  payment_id uuid references payments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  coach_id    uuid references coaches(id) on delete set null,
  starts_at   timestamptz,
  location    text,
  capacity    int,
  created_at  timestamptz not null default now()
);

create table session_attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  athlete_id  uuid not null references athletes(id) on delete cascade,
  present     boolean not null default true,
  recorded_at timestamptz not null default now(),
  unique (session_id, athlete_id)
);

create index on athletes (category_id);
create index on enrollments (athlete_id);
create index on memberships (athlete_id);
create index on sessions (category_id);
create index on session_attendance (session_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table categories         enable row level security;
alter table coaches            enable row level security;
alter table programs           enable row level security;
alter table athletes           enable row level security;
alter table enrollments        enable row level security;
alter table memberships        enable row level security;
alter table sessions           enable row level security;
alter table session_attendance enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read programs" on programs for select using (active);

do $$
declare t text;
begin
  foreach t in array array[
    'categories','coaches','programs','athletes',
    'enrollments','memberships','sessions','session_attendance'
  ]
  loop
    execute format('create policy "admin all %1$s" on %1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Public enrollment via SECURITY DEFINER (no table-write exposure to anon).
create or replace function public.enroll_athlete(
  p_first text, p_last text, p_dob date, p_category_id uuid,
  p_guardian_name text, p_guardian_phone text, p_guardian_email text, p_medical text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_athlete uuid;
begin
  if coalesce(trim(p_first), '') = '' or coalesce(trim(p_last), '') = '' then
    raise exception 'Prenom et nom requis';
  end if;
  insert into athletes (first_name, last_name, dob, category_id, guardian_name, guardian_phone, guardian_email, medical_notes)
  values (p_first, p_last, p_dob, p_category_id,
          nullif(p_guardian_name, ''), nullif(p_guardian_phone, ''), nullif(p_guardian_email, ''), nullif(p_medical, ''))
  returning id into v_athlete;
  insert into enrollments (athlete_id, category_id, status) values (v_athlete, p_category_id, 'pending');
  return v_athlete;
end;
$$;
revoke all on function public.enroll_athlete(text, text, date, uuid, text, text, text, text) from public;
grant execute on function public.enroll_athlete(text, text, date, uuid, text, text, text, text) to anon, authenticated;

-- Seed the training categories.
insert into categories (name, age_min, age_max, schedule, monthly_fee_xof, sort) values
  ('U10',    7, 10, 'Sam 10h-11h30',        12000, 1),
  ('U12',   10, 12, 'Mar/Jeu 17h-18h30',    15000, 2),
  ('U14',   12, 14, 'Mar/Jeu 18h-19h30',    15000, 3),
  ('U16',   14, 16, 'Lun/Mer/Ven 18h-20h',  18000, 4),
  ('U18',   16, 18, 'Lun/Mer/Ven 18h-20h',  18000, 5),
  ('Open',  18, 99, 'Mar/Jeu 20h-22h',      20000, 6),
  ('Femmes',14, 99, 'Sam 16h-18h',          15000, 7);
