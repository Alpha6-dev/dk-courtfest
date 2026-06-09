-- DK CourtFest — Phase 3: offline check-in sync.
-- The check-in PWA records scans on-device while offline and flushes them here
-- when the connection returns. `client_id` makes the flush idempotent so a
-- retried sync never double-counts a scan.

alter table check_ins add column if not exists client_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_ins_client_id_key'
  ) then
    alter table check_ins add constraint check_ins_client_id_key unique (client_id);
  end if;
end $$;

-- Bulk-apply queued check-ins. Preserves the original on-device scan time.
create or replace function public.sync_check_ins(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r       jsonb;
  v_id    uuid;
  ins     int := 0;
  skip    int := 0;
begin
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
  loop
    select id into v_id from tickets where qr_token = r->>'token';
    if v_id is null then
      skip := skip + 1;
      continue;
    end if;

    insert into check_ins (ticket_id, gate, device_id, scanned_at, client_id)
    values (
      v_id,
      r->>'gate',
      r->>'device',
      coalesce(nullif(r->>'scanned_at', '')::timestamptz, now()),
      r->>'client_id'
    )
    on conflict (client_id) do nothing;

    if found then
      ins := ins + 1;
      update tickets set status = 'used' where id = v_id and status <> 'used';
    else
      skip := skip + 1;
    end if;
  end loop;

  return jsonb_build_object('inserted', ins, 'skipped', skip);
end;
$$;

revoke all on function public.sync_check_ins(jsonb) from public;
grant execute on function public.sync_check_ins(jsonb) to authenticated;
