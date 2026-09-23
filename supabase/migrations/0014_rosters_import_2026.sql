-- DK CourtFest - import of the Courtfest Dakar 2026 rosters (1 November 2026)
-- from the WhatsApp community groups, read on 22 and 23 September 2026.
-- Names are the WhatsApp display names; members saved only as a number keep the
-- number as their name until the admin renames them. Phone numbers are filled
-- later from the phone's contacts.
-- Applied to the Supabase project on 2026-09-23 (migration "rosters_import_2026").
-- Idempotent: rows already present (same edition, category and name) are skipped.

insert into rosters (edition_id, category, full_name, whatsapp_name, phone, source, whatsapp_group)
select e.id, v.category, v.full_name, v.full_name, v.phone, 'whatsapp', v.grp
from editions e
join (values
  -- Elite Men's basketball game (17)
  ('elite_men', 'Badou Faye Marius',    null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Beguee Mermoz',        null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Bernard',              null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Besy Sy',              null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Djiby Boy DUC',        null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Iba Thomas',           null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Ikhlas Sy',            null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Lamine Badji ASVD',    null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Mohamed Diouf Douane', null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Mohamed Keminta',      null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Mohamed Mbao',         null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Pa djiby',             null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Sidy Jite',            null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Sylla JA',             null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Tieki',                null,                 'Elite Men''s basketball game'),
  ('elite_men', 'Yoro DUC',             null,                 'Elite Men''s basketball game'),
  ('elite_men', '+221 77 073 01 94',    '+221 77 073 01 94',  'Elite Men''s basketball game'),
  -- Veteran's/Celebrity Game (11)
  ('veterans',  'Ahmet Fiit',           null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Amdy Fall',            null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Arfang Actor',         null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Besy Sy',              null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Jordan Gabon',         null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Mocc',                 null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Sandjiri Sy',          null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Thiaw Basketball',     null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Tijan Electric Bike',  null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Vincent Mendy',        null,                 'Veteran''s/Celebrity Game'),
  ('veterans',  'Yoro DUC',             null,                 'Veteran''s/Celebrity Game'),
  -- La Releve (5)
  ('youth',     'Gaskillah',            null,                 'La Releve'),
  ('youth',     'Ikhlas Sy',            null,                 'La Releve'),
  ('youth',     'Lanfia Magassouba',    null,                 'La Releve'),
  ('youth',     'Mohamed Camara Alcess', null,                'La Releve'),
  ('youth',     'Tieki',                null,                 'La Releve')
) as v(category, full_name, phone, grp) on true
where e.name = 'Courtfest Dakar 2026'
on conflict (edition_id, category, full_name) do nothing;
