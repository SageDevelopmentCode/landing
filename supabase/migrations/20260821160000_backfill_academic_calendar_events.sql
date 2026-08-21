-- Backfill 2026–2027 academic calendar into calendar.events
-- Safe to re-run: skips rows already seeded via internal_notes marker
-- Run manually in the Supabase SQL editor on production.

BEGIN;

WITH holiday_ranges AS (
  SELECT *
  FROM (VALUES
    -- Key date (first day already exists manually on 2026-08-17)
    ('Last Day of School', DATE '2027-05-27', DATE '2027-05-27', 'Academic', '#7A9E5E', 'Last day of the 2026–2027 school year.', 'last_day'),

    -- Holidays / breaks (one row per closed day)
    ('Labor Day — No School', DATE '2026-09-07', DATE '2026-09-07', 'Holiday', '#D49A3A', 'School closed', 'labor_day'),
    ('Student Holiday — No School', DATE '2026-10-12', DATE '2026-10-12', 'Holiday', '#D49A3A', 'School closed', 'student_holiday'),
    ('Thanksgiving Break — No School', DATE '2026-11-23', DATE '2026-11-27', 'Holiday', '#D49A3A', 'School closed', 'thanksgiving'),
    ('Winter Break — No School', DATE '2026-12-18', DATE '2027-01-01', 'Holiday', '#5B9BBF', 'School closed', 'winter_break'),
    ('MLK Jr. Day — No School', DATE '2027-01-18', DATE '2027-01-18', 'Holiday', '#5B9BBF', 'School closed', 'mlk_day'),
    ('President''s Day — No School', DATE '2027-02-15', DATE '2027-02-15', 'Holiday', '#5B9BBF', 'School closed', 'presidents_day'),
    ('Spring Break — No School', DATE '2027-03-15', DATE '2027-03-19', 'Holiday', '#7A9E5E', 'School closed', 'spring_break'),
    ('Good Friday — No School', DATE '2027-03-26', DATE '2027-03-26', 'Holiday', '#7A9E5E', 'School closed', 'good_friday')
  ) AS v(title, start_date, end_date, category, color, description, holiday_key)
),
expanded_days AS (
  SELECT
    r.title,
    gs.event_date::date AS event_date,
    r.category,
    r.color,
    r.description,
    'source:academic_calendar:2026-2027:' || r.holiday_key || ':' || to_char(gs.event_date, 'YYYY-MM-DD') AS internal_notes
  FROM holiday_ranges r
  CROSS JOIN LATERAL generate_series(r.start_date, r.end_date, INTERVAL '1 day') AS gs(event_date)
)
INSERT INTO calendar.events (
  title,
  event_date,
  is_all_day,
  category,
  color,
  description,
  shared_with,
  programs,
  recurrence,
  internal_notes
)
SELECT
  d.title,
  d.event_date,
  true,
  d.category,
  d.color,
  d.description,
  ARRAY['Parents', 'Teachers']::text[],
  ARRAY['Both']::text[],
  'None',
  d.internal_notes
FROM expanded_days d
WHERE NOT EXISTS (
  SELECT 1
  FROM calendar.events e
  WHERE e.internal_notes = d.internal_notes
);

COMMIT;
