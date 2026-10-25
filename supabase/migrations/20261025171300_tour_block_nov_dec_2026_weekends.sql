-- Full-day tour blocks for all Fridays and Saturdays in Nov–Dec 2026
INSERT INTO marketing.tour_unavailability (unavailable_date, unavailable_time, reason, is_recurring)
SELECT d::date, NULL, 'No campus tours (Fri/Sat)', false
FROM unnest(ARRAY[
  '2026-11-06'::date,
  '2026-11-07'::date,
  '2026-11-13'::date,
  '2026-11-14'::date,
  '2026-11-20'::date,
  '2026-11-21'::date,
  '2026-11-27'::date,
  '2026-11-28'::date,
  '2026-12-04'::date,
  '2026-12-05'::date,
  '2026-12-11'::date,
  '2026-12-12'::date,
  '2026-12-18'::date,
  '2026-12-19'::date,
  '2026-12-25'::date,
  '2026-12-26'::date
]) AS d
WHERE NOT EXISTS (
  SELECT 1
  FROM marketing.tour_unavailability u
  WHERE u.unavailable_date = d
    AND u.unavailable_time IS NULL
    AND u.is_recurring = false
);
