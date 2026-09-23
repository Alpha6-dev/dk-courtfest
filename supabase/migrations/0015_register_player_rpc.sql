-- DK CourtFest - public player registration into rosters (one player, one
-- category) through a SECURITY DEFINER function, like register_team: anonymous
-- visitors never get table access, only EXECUTE on this function.
-- A player already listed for the edition and category (for example imported
-- from the WhatsApp groups) is not duplicated: the missing phone number and the
-- notes are filled in, an existing phone number is kept.
-- Applied to the Supabase project on 2026-09-23 (migration "register_player_rpc").

create or replace function public.register_player(
  p_edition_id uuid,
  p_category   text,
  p_full_name  text,
  p_phone      text,
  p_notes      text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_name  text := regexp_replace(trim(coalesce(p_full_name, '')), '\s+', ' ', 'g');
  v_phone text := nullif(regexp_replace(trim(coalesce(p_phone, '')), '\s+', ' ', 'g'), '');
begin
  if length(v_name) < 2 then
    raise exception 'Nom requis';
  end if;
  if v_phone is null or length(regexp_replace(v_phone, '\D', '', 'g')) < 9 then
    raise exception 'Numéro de téléphone requis';
  end if;
  if p_category not in ('elite_men', 'elite_women', 'veterans', 'youth', 'open') then
    raise exception 'Catégorie invalide';
  end if;
  if not exists (select 1 from editions where id = p_edition_id and status = 'open') then
    raise exception 'Les inscriptions sont fermées';
  end if;

  insert into rosters (edition_id, category, full_name, phone, source, status, notes)
  values (p_edition_id, p_category, v_name, v_phone, 'site', 'registered', nullif(trim(p_notes), ''))
  on conflict (edition_id, category, full_name) do update
    set phone = coalesce(rosters.phone, excluded.phone),
        notes = coalesce(excluded.notes, rosters.notes)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.register_player(uuid, text, text, text, text) from public;
grant execute on function public.register_player(uuid, text, text, text, text) to anon, authenticated;
