-- DK CourtFest — public registration via a SECURITY DEFINER function.
-- Lets anonymous visitors register a team + players atomically WITHOUT granting
-- them table-level read/insert access. The function runs as its owner (bypasses
-- RLS), so anon only needs EXECUTE on this one function.

create or replace function public.register_team(
  p_edition_id   uuid,
  p_name         text,
  p_division     division,
  p_category     text,
  p_captain_name text,
  p_captain_phone text,
  p_captain_email text,
  p_players      jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_player  jsonb;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_captain_name), '') = '' then
    raise exception 'Nom d''équipe et capitaine requis';
  end if;

  insert into teams (edition_id, name, division, category,
                     captain_name, captain_phone, captain_email)
  values (p_edition_id, p_name, p_division, nullif(p_category, ''),
          p_captain_name, p_captain_phone, nullif(p_captain_email, ''))
  returning id into v_team_id;

  for v_player in select * from jsonb_array_elements(coalesce(p_players, '[]'::jsonb))
  loop
    insert into players (team_id, first_name, last_name, jersey_no, position)
    values (
      v_team_id,
      v_player->>'first_name',
      v_player->>'last_name',
      nullif(v_player->>'jersey_no', '')::int,
      nullif(v_player->>'position', '')
    );
  end loop;

  return v_team_id;
end;
$$;

-- Lock down then grant execute only to the API roles.
revoke all on function public.register_team(uuid, text, division, text, text, text, text, jsonb) from public;
grant execute on function public.register_team(uuid, text, division, text, text, text, text, jsonb) to anon, authenticated;

-- The RPC is now the only sanctioned public write path; drop the broad
-- anon INSERT policies so the public can't write arbitrary rows directly.
drop policy if exists "public insert teams" on teams;
drop policy if exists "public insert players" on players;
