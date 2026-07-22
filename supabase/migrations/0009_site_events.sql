-- First-party, cookie-less site analytics (feeds the weekly funnel review).
-- Same security pattern as capture_lead: anon can only INSERT via the RPC; no reads.
-- Applied to production 2026-07-22 via MCP (site_events_analytics).

create table if not exists site_events (
  id bigint generated always as identity primary key,
  event text not null check (char_length(event) <= 64),
  path text check (char_length(path) <= 256),
  session_id text check (char_length(session_id) <= 64),
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_events_event_created_idx on site_events (event, created_at);
create index if not exists site_events_created_idx on site_events (created_at);

alter table site_events enable row level security;
-- no policies: deny-all for anon/authenticated; only the RPC (security definer) writes.

create or replace function capture_event(
  p_event text,
  p_path text default null,
  p_session text default null,
  p_meta jsonb default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event is null or char_length(p_event) = 0 or char_length(p_event) > 64 then
    return; -- silently drop malformed beacons
  end if;
  insert into site_events (event, path, session_id, meta)
  values (p_event, left(p_path, 256), left(p_session, 64), p_meta);
end;
$$;

revoke all on function capture_event(text, text, text, jsonb) from public;
grant execute on function capture_event(text, text, text, jsonb) to anon, authenticated;
