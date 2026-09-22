-- DK CourtFest - the 2026 main event is set for Sunday 1 November 2026 in Dakar
-- (the week the city hosts the Youth Olympic Games).
-- Applied to the Supabase project on 2026-09-22 via the migration tool
-- (edition_dakar_2026_11_01).
--
-- The app resolves the active edition as the most recently created editions row
-- (src/lib/edition.ts), so inserting this row switches public registration,
-- ticketing and the admin match tools to the November event. The founding
-- edition (DK CourtFest Vol. 01, 8 June 2026) keeps its registered teams.
-- Venue and hours are not fixed yet: update this row when they are.
-- Idempotent: safe to re-run.

insert into editions (name, season, event_date, venue, status, city, country, city_code)
select 'Courtfest Dakar 2026', '2026/2027', date '2026-11-01', null, 'open', 'Dakar', 'SN', 'DK'
where not exists (select 1 from editions where event_date = date '2026-11-01');
