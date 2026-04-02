-- ============================================
-- Add booking_id FK to tour_unavailability
-- ============================================
-- Links an unavailability row back to the tour_bookings record
-- that caused it (set automatically when a parent books a tour).
-- Manually-created blocks leave this NULL.

ALTER TABLE marketing.tour_unavailability
  ADD COLUMN IF NOT EXISTS booking_id UUID
    REFERENCES marketing.tour_bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tour_unavailability_booking_id
  ON marketing.tour_unavailability (booking_id);
