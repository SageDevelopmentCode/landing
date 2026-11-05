ALTER TABLE admin.family_map_drive_times
  ADD COLUMN IF NOT EXISTS origin_lat double precision,
  ADD COLUMN IF NOT EXISTS origin_lng double precision,
  ADD COLUMN IF NOT EXISTS dest_lat double precision,
  ADD COLUMN IF NOT EXISTS dest_lng double precision;

-- Rows routed before endpoints were recorded point at the old Hutto pin.
DELETE FROM admin.family_map_drive_times
WHERE dest_lat IS NULL OR dest_lng IS NULL;
