-- DK CourtFest - the 2026 main event moved from Sunday 15 November to Sunday 13 December 2026,
-- at Terrain Djily Mbaye (venue already set by migration 0018). Moves the existing
-- "Courtfest Dakar 2026" editions row; the founding edition and all registered teams and
-- rosters are untouched.
-- Idempotent: only changes the row while it still carries the old date.

update editions
set event_date = date '2026-12-13'
where name = 'Courtfest Dakar 2026' and event_date = date '2026-11-15';
