-- Explicit absent marking for school year weekday + Field Fun Friday attendance.

ALTER TABLE attendance.school_year_records
  ADD COLUMN IF NOT EXISTS marked_absent boolean NOT NULL DEFAULT false;

ALTER TABLE attendance.school_year_field_friday_records
  ADD COLUMN IF NOT EXISTS marked_absent boolean NOT NULL DEFAULT false;
