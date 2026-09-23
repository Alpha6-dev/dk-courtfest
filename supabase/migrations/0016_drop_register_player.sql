-- DK CourtFest - public player self-registration removed (decision of 2026-09-23):
-- the rosters are curated by the organisation (WhatsApp community groups and
-- the admin tab), not opened to self sign-up on the site. This drops the
-- register_player function created by migration 0015; the rosters table and
-- its admin-only policy stay.
-- Applied to the Supabase project on 2026-09-23 (migration "drop_register_player").

drop function if exists public.register_player(uuid, text, text, text, text);
