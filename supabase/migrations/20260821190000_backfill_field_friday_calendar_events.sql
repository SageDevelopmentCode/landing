-- Backfill 2026–2027 Field Friday themes into calendar.events
-- Safe to re-run: skips rows already seeded via internal_notes marker
-- Run manually in the Supabase SQL editor on production.

BEGIN;

WITH field_fridays AS (
  SELECT *
  FROM (VALUES
    ('Wild Safari 🦒',                         DATE '2026-08-21', 'wild_safari'),
    ('Construction Zone 🚧',                   DATE '2026-08-28', 'construction_zone'),
    ('Wild West 🐴',                           DATE '2026-09-04', 'wild_west'),
    ('Dragons & Mythical Creatures 🧜🏽‍♀️',     DATE '2026-09-11', 'dragons_mythical'),
    ('Desert Discovery 🏜️',                     DATE '2026-09-18', 'desert_discovery'),
    ('At the Zoo 🐢',                          DATE '2026-09-25', 'at_the_zoo'),
    ('Camping Adventures 🏕️',                   DATE '2026-10-02', 'camping_adventures'),
    ('Wizard Academy 🧙🏽‍♀️',                   DATE '2026-10-09', 'wizard_academy'),
    ('Little Scientists 👩🏽‍🔬',                  DATE '2026-10-16', 'little_scientists'),
    ('Fairytale Kingdom 🏰',                   DATE '2026-10-23', 'fairytale_kingdom'),
    ('Not-So-Scary-Halloween 🎃',              DATE '2026-10-30', 'not_so_scary_halloween'),
    ('Autumn Adventure 🍁',                    DATE '2026-11-06', 'autumn_adventure'),
    ('Race Cars and Speedsters 🏎️',             DATE '2026-11-13', 'race_cars'),
    ('Thankful & Grateful 🦃',                 DATE '2026-11-20', 'thankful_grateful'),
    ('Robot Builders 🤖',                      DATE '2026-12-04', 'robot_builders'),
    ('Santa''s Workshop Adventures 🎅🏽',       DATE '2026-12-11', 'santas_workshop'),
    ('Arctic Explores 🐻‍❄️',                    DATE '2027-01-08', 'arctic_explores'),
    ('Little Chefs 👩🏽‍🍳',                     DATE '2027-01-15', 'little_chefs'),
    ('Colors of the World 🌈',                 DATE '2027-01-22', 'colors_of_the_world'),
    ('Animal Rescue 🐕‍🦺',                       DATE '2027-01-29', 'animal_rescue'),
    ('Community Helpers 🚒',                   DATE '2027-02-05', 'community_helpers'),
    ('Spread the Love 💌',                      DATE '2027-02-12', 'spread_the_love'),
    ('Little Artist 👩🏽‍🎨',                     DATE '2027-02-19', 'little_artist'),
    ('Garden Glowers 🪴',                      DATE '2027-02-26', 'garden_growers'),
    ('Yo-Ho-Ho Adventure 🏴‍☠️',                 DATE '2027-03-05', 'yo_ho_ho'),
    ('Shamrocks & Egg Hunts 🪺',               DATE '2027-03-12', 'shamrocks_egg_hunts'),
    ('Teddy Bear Picnic 🧸',                   DATE '2027-04-02', 'teddy_bear_picnic'),
    ('Dino Discovery 🦕',                      DATE '2027-04-09', 'dino_discovery'),
    ('Fairy Garden 🧚🏽‍♀️',                     DATE '2027-04-16', 'fairy_garden'),
    ('Earth Hero''s 🌎',                       DATE '2027-04-23', 'earth_heros'),
    ('Under the Sea 🪸',                       DATE '2027-04-30', 'under_the_sea'),
    ('Jungle Explorers 🐒',                    DATE '2027-05-07', 'jungle_explorers'),
    ('The Great Space Adventure 🛸',             DATE '2027-05-14', 'space_adventure'),
    ('Beach Bash 🏖️',                          DATE '2027-05-21', 'beach_bash')
  ) AS v(theme, event_date, theme_key)
)
INSERT INTO calendar.events (
  title,
  event_date,
  is_all_day,
  start_time,
  end_time,
  category,
  color,
  shared_with,
  programs,
  recurrence,
  internal_notes
)
SELECT
  'Field Friday: ' || f.theme,
  f.event_date,
  false,
  '09:00:00',
  '13:00:00',
  'Other',
  '#16A34A',
  ARRAY['Parents', 'Teachers']::text[],
  ARRAY['Both']::text[],
  'None',
  'source:field_friday:school_year_26_27:' || f.theme_key || ':' || to_char(f.event_date, 'YYYY-MM-DD')
FROM field_fridays f
WHERE NOT EXISTS (
  SELECT 1
  FROM calendar.events e
  WHERE e.internal_notes = 'source:field_friday:school_year_26_27:' || f.theme_key || ':' || to_char(f.event_date, 'YYYY-MM-DD')
);

COMMIT;
