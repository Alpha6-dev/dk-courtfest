-- DK CourtFest — Row Level Security (Phase 1)
-- Model: the public can READ the event + matches and SUBMIT a registration.
-- Everything else requires an authenticated admin (a Supabase Auth user).

alter table editions  enable row level security;
alter table teams     enable row level security;
alter table players   enable row level security;
alter table contacts  enable row level security;
alter table tickets   enable row level security;
alter table check_ins enable row level security;
alter table sponsors  enable row level security;
alter table payments  enable row level security;
alter table matches   enable row level security;
alter table staff     enable row level security;

-- ── Public reads (the marketing site) ────────────────────────────────────────
create policy "public read editions" on editions
  for select using (true);

create policy "public read matches" on matches
  for select using (true);

-- ── Public registration: anonymous visitors may INSERT only ──────────────────
create policy "public insert teams" on teams
  for insert with check (true);

create policy "public insert players" on players
  for insert with check (true);

create policy "public insert contacts" on contacts
  for insert with check (true);

-- ── Admin (any signed-in user) full access ───────────────────────────────────
-- Tighten later with a roles table if you add non-admin logins.
do $$
declare t text;
begin
  foreach t in array array[
    'editions','teams','players','contacts','tickets',
    'check_ins','sponsors','payments','matches','staff'
  ]
  loop
    execute format(
      'create policy "admin all %1$s" on %1$s for all
         to authenticated using (true) with check (true);', t);
  end loop;
end $$;
