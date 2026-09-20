-- DK CourtFest - remove the em dash from stored strings (site-wide copy rule).
-- Applied to the Supabase project on 2026-09-20 (migration "remove_em_dash").
-- Idempotent: safe to re-run.

create or replace function public.capture_lead(
  p_email  text,
  p_source text default 'landing'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_email = '' or position('@' in v_email) = 0 or position('.' in v_email) = 0 then
    raise exception 'Email invalide';
  end if;

  -- Soft de-dupe: skip if this email is already on file as a lead.
  if exists (select 1 from contacts where type = 'lead' and lower(email) = v_email) then
    return;
  end if;

  insert into contacts (type, full_name, email, notes)
  values ('lead', v_email, v_email,
          'Landing: ' || coalesce(nullif(trim(p_source), ''), 'rejoindre'));
end;
$$;

-- Lead notes written by the previous version of capture_lead.
update contacts
   set notes = replace(notes, 'Landing ' || chr(8212) || ' ', 'Landing: ')
 where notes like 'Landing ' || chr(8212) || ' %';

-- Seeded edition name: drop the dash separator (DK CourtFest Vol. 01).
update editions
   set name = replace(name, ' ' || chr(8212) || ' ', ' ')
 where name like '%' || chr(8212) || '%';
