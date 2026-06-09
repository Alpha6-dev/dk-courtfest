-- DK CourtFest — Phase 4: enable Supabase Realtime on matches so the broadcast
-- overlays update live when an admin changes the score.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table matches;
  end if;
end $$;
