-- Per-day roster: staff can hide paid students or add unpaid students without check-in.
-- Run manually in Supabase SQL editor for production.

ALTER TABLE attendance.school_year_records
  ADD COLUMN IF NOT EXISTS excluded_from_roster boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false;

ALTER TABLE attendance.school_year_field_friday_records
  ADD COLUMN IF NOT EXISTS excluded_from_roster boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false;

-- Existing non-absent rows were treated as checked in before this column existed.
UPDATE attendance.school_year_records
SET checked_in = true
WHERE marked_absent = false;

UPDATE attendance.school_year_field_friday_records
SET checked_in = true
WHERE marked_absent = false;
