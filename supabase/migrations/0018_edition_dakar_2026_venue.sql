-- DK CourtFest - the venue of the 2026 main event is Terrain Djily Mbaye (Dakar).
-- Sets it on the "Courtfest Dakar 2026" editions row; the buy page summary reads it from there.
-- Idempotent: only fills the venue while it is still empty.

update editions
set venue = 'Terrain Djily Mbaye'
where name = 'Courtfest Dakar 2026' and venue is null;
