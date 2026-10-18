-- DK CourtFest - the 2026 main event moved from Sunday 1 November to Sunday 15 November 2026
-- (two days after the Youth Olympic Games close). Moves the existing "Courtfest Dakar 2026"
-- editions row; the founding edition and all registered teams and rosters are untouched.
-- Idempotent: only changes the row while it still carries the old date.

update editions
set event_date = date '2026-11-15'
where name = 'Courtfest Dakar 2026' and event_date = date '2026-11-01';
