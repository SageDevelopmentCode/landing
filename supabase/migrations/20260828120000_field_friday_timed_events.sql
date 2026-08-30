-- Field Friday events: 9am–1pm timed slots, category "Other"
-- Run manually in the Supabase SQL editor on production.

BEGIN;

UPDATE calendar.events
SET
  is_all_day = false,
  start_time = '09:00:00',
  end_time = '13:00:00',
  category = 'Other',
  updated_at = now()
WHERE title LIKE 'Field Friday:%';

COMMIT;
