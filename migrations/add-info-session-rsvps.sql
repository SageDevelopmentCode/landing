-- ============================================
-- MARKETING SCHEMA — Info Session RSVPs
-- ============================================
-- Adds to the existing marketing schema:
--   marketing.info_session_rsvps  — public RSVP form submissions

-- ============================================
-- TABLE: marketing.info_session_rsvps
-- ============================================
CREATE TABLE IF NOT EXISTS marketing.info_session_rsvps (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent / guardian
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT        NOT NULL,

  -- Children as JSON array: [{name: string, age: string}]
  children      JSONB       NOT NULL DEFAULT '[]',

  -- Programs of interest: ["summer-2026", "school-year", "homeschool"]
  programs      TEXT[]      NOT NULL DEFAULT '{}',

  -- Referral source
  hear_about_us TEXT,

  -- Pre-submitted questions
  questions     TEXT,

  -- Admin status tracking
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN (
                              'pending',
                              'attended',
                              'no_show',
                              'cancelled'
                            )),

  -- Soft delete
  is_deleted    BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_info_session_rsvps_email
  ON marketing.info_session_rsvps (email);

CREATE INDEX IF NOT EXISTS idx_marketing_info_session_rsvps_created_at
  ON marketing.info_session_rsvps (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_info_session_rsvps_is_deleted
  ON marketing.info_session_rsvps (is_deleted);

CREATE TRIGGER set_info_session_rsvps_updated_at
  BEFORE UPDATE ON marketing.info_session_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE marketing.info_session_rsvps ENABLE ROW LEVEL SECURITY;

-- anon: can INSERT (public form), blocked from SELECT
CREATE POLICY "Allow public insert to info_session_rsvps"
  ON marketing.info_session_rsvps
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Prevent public read of info_session_rsvps"
  ON marketing.info_session_rsvps
  FOR SELECT
  TO anon
  USING (false);

-- authenticated admins: full CRUD
CREATE POLICY "Admins can read info_session_rsvps"
  ON marketing.info_session_rsvps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update info_session_rsvps"
  ON marketing.info_session_rsvps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete info_session_rsvps"
  ON marketing.info_session_rsvps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

-- ============================================
-- GRANTS
-- ============================================
GRANT INSERT ON marketing.info_session_rsvps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.info_session_rsvps TO authenticated;
GRANT ALL ON marketing.info_session_rsvps TO service_role;
