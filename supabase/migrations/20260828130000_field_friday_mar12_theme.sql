-- Rename Mar 12, 2027 Field Friday theme to Shamrocks & Egg Hunts
-- Run manually in the Supabase SQL editor on production.

BEGIN;

UPDATE calendar.events
SET
  title = 'Field Friday: Shamrocks & Egg Hunts 🪺',
  internal_notes = 'source:field_friday:school_year_26_27:shamrocks_egg_hunts:2027-03-12',
  updated_at = now()
WHERE event_date = DATE '2027-03-12'
  AND title LIKE 'Field Friday:%';

COMMIT;
