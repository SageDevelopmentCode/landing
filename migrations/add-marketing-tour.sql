-- ============================================
-- MARKETING SCHEMA — Tour Booking Tables
-- ============================================
-- Adds to the existing marketing schema:
--   1. marketing.tour_bookings        — public form submissions
--   2. marketing.tour_unavailability  — admin-managed date/time blocks

-- ============================================
-- SHARED TRIGGER FUNCTION (may already exist)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: marketing.tour_bookings
-- ============================================
CREATE TABLE IF NOT EXISTS marketing.tour_bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent / guardian
  first_name       TEXT        NOT NULL,
  last_name        TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  phone            TEXT,

  -- Child info
  child_name       TEXT        NOT NULL,
  child_grade      TEXT        NOT NULL CHECK (child_grade IN (
                     'Pre-K',
                     'Kindergarten',
                     '1st Grade',
                     '2nd Grade',
                     '3rd Grade',
                     '4th Grade',
                     '5th Grade',
                     '6th Grade',
                     '7th Grade',
                     '8th Grade'
                   )),
  num_children     INTEGER     NOT NULL DEFAULT 1 CHECK (num_children >= 1 AND num_children <= 5),

  -- Tour schedule
  tour_date        DATE        NOT NULL,
  tour_time        TEXT        NOT NULL,

  -- Referral
  how_did_you_hear TEXT        NOT NULL CHECK (how_did_you_hear IN (
                     'google',
                     'social_media',
                     'friend_family',
                     'flyer',
                     'other'
                   )),

  -- Optional notes
  accommodations   TEXT,

  -- Admin status tracking
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN (
                     'pending',
                     'confirmed',
                     'cancelled',
                     'completed',
                     'no_show'
                   )),

  -- Soft delete
  is_deleted       BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_tour_bookings_email
  ON marketing.tour_bookings (email);

CREATE INDEX IF NOT EXISTS idx_marketing_tour_bookings_tour_date
  ON marketing.tour_bookings (tour_date);

CREATE INDEX IF NOT EXISTS idx_marketing_tour_bookings_status
  ON marketing.tour_bookings (status);

CREATE INDEX IF NOT EXISTS idx_marketing_tour_bookings_is_deleted
  ON marketing.tour_bookings (is_deleted);

CREATE INDEX IF NOT EXISTS idx_marketing_tour_bookings_created_at
  ON marketing.tour_bookings (created_at DESC);

CREATE TRIGGER set_tour_bookings_updated_at
  BEFORE UPDATE ON marketing.tour_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE marketing.tour_bookings ENABLE ROW LEVEL SECURITY;

-- anon: can INSERT (public form), blocked from SELECT
CREATE POLICY "Allow public insert to tour_bookings"
  ON marketing.tour_bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Prevent public read of tour_bookings"
  ON marketing.tour_bookings
  FOR SELECT
  TO anon
  USING (false);

-- authenticated admins: full CRUD
CREATE POLICY "Admins can read tour_bookings"
  ON marketing.tour_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update tour_bookings"
  ON marketing.tour_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete tour_bookings"
  ON marketing.tour_bookings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

-- ============================================
-- TABLE: marketing.tour_unavailability
-- ============================================
CREATE TABLE IF NOT EXISTS marketing.tour_unavailability (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date being blocked (NULL unavailable_time = entire day blocked)
  unavailable_date  DATE        NOT NULL,
  unavailable_time  TEXT,

  -- Internal admin note e.g. "Staff meeting", "Holiday"
  reason            TEXT,

  -- For recurring weekly blocks
  is_recurring      BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_tour_unavailability_date
  ON marketing.tour_unavailability (unavailable_date);

CREATE TRIGGER set_tour_unavailability_updated_at
  BEFORE UPDATE ON marketing.tour_unavailability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE marketing.tour_unavailability ENABLE ROW LEVEL SECURITY;

-- anon: can SELECT (calendar reads blocked dates without auth)
CREATE POLICY "Allow public read of tour_unavailability"
  ON marketing.tour_unavailability
  FOR SELECT
  TO anon
  USING (true);

-- authenticated admins: manage blocks
CREATE POLICY "Admins can insert tour_unavailability"
  ON marketing.tour_unavailability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update tour_unavailability"
  ON marketing.tour_unavailability
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete tour_unavailability"
  ON marketing.tour_unavailability
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA marketing TO anon, authenticated, service_role;

-- tour_bookings: anon insert only
GRANT INSERT ON marketing.tour_bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.tour_bookings TO authenticated;

-- tour_unavailability: anon read only (calendar)
GRANT SELECT ON marketing.tour_unavailability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.tour_unavailability TO authenticated;

-- service_role blanket (covers future tables too)
GRANT ALL ON ALL TABLES IN SCHEMA marketing TO service_role;
