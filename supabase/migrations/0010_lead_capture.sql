-- DK CourtFest — public lead capture from the landing "Rejoindre" email form.
--
-- Adds a 'lead' contact type and a SECURITY DEFINER RPC so anonymous visitors
-- can drop their email WITHOUT table-level insert access (mirrors register_team
-- in 0003). The broad anon INSERT policy on contacts is dropped so the RPC is
-- the only sanctioned public write path.

alter type contact_type add value if not exists 'lead';

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
          'Landing — ' || coalesce(nullif(trim(p_source), ''), 'rejoindre'));
end;
$$;

revoke all on function public.capture_lead(text, text) from public;
grant execute on function public.capture_lead(text, text) to anon, authenticated;

drop policy if exists "public insert contacts" on contacts;
