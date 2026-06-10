-- Expansion-readiness (cheap now, painful later):
-- 1. Multi-currency: every payment carries its currency (XOF today; NGN/GHS/… later).
-- 2. Multi-city editions: an edition knows its city + country, so "ABJ CourtFest 2027"
--    is a row, not a rebuild. Existing rows backfilled to Dakar/SN.

alter table payments add column if not exists currency text not null default 'XOF';

alter table editions add column if not exists city    text not null default 'Dakar';
alter table editions add column if not exists country text not null default 'SN';   -- ISO 3166-1 alpha-2
alter table editions add column if not exists city_code text not null default 'DK'; -- brand monogram code
