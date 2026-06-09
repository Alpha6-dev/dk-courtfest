-- DK CourtFest — Phase 2: ticketing & check-in functions.
-- Admins (authenticated) issue/list tickets directly via the "admin all" RLS
-- policies. These two SECURITY DEFINER functions cover the public + staff paths.

-- ── Public: view a ticket by its QR token (safe fields only, no table read) ──
create or replace function public.get_ticket(p_token text)
returns table (
  holder_name  text,
  type         ticket_type,
  status       ticket_status,
  edition_name text,
  event_date   date,
  venue        text
)
language sql
security definer
set search_path = public
as $$
  select t.holder_name, t.type, t.status, e.name, e.event_date, e.venue
  from tickets t
  join editions e on e.id = t.edition_id
  where t.qr_token = p_token;
$$;

revoke all on function public.get_ticket(text) from public;
grant execute on function public.get_ticket(text) to anon, authenticated;

-- ── Staff: check a ticket in. Logs the scan and marks the ticket used. ───────
-- Returns a small JSON verdict the check-in UI can render.
create or replace function public.check_in_ticket(
  p_token  text,
  p_gate   text default null,
  p_device text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket  tickets;
  v_already boolean;
begin
  select * into v_ticket from tickets where qr_token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_ticket.status = 'void' then
    return jsonb_build_object('ok', false, 'reason', 'void', 'holder', v_ticket.holder_name);
  end if;

  select exists(select 1 from check_ins where ticket_id = v_ticket.id) into v_already;

  insert into check_ins (ticket_id, gate, device_id)
  values (v_ticket.id, p_gate, p_device);

  update tickets set status = 'used' where id = v_ticket.id;

  return jsonb_build_object(
    'ok', true,
    'holder', v_ticket.holder_name,
    'type', v_ticket.type,
    'already', v_already   -- true = this ticket was already scanned before
  );
end;
$$;

revoke all on function public.check_in_ticket(text, text, text) from public;
-- Staff must be logged in (authenticated) to check tickets in.
grant execute on function public.check_in_ticket(text, text, text) to authenticated;
