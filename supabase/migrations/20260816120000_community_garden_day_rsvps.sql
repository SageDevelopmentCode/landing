-- ============================================
-- MARKETING SCHEMA — Community Garden Day RSVPs
-- ============================================
--   marketing.community_garden_day_rsvps — public RSVP form submissions

CREATE TABLE IF NOT EXISTS marketing.community_garden_day_rsvps (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  parent_name         TEXT        NOT NULL,
  email               TEXT        NOT NULL UNIQUE,
  phone               TEXT,
  adults_attending    TEXT        NOT NULL,
  children_attending  TEXT        NOT NULL,
  is_sage_field_family TEXT       NOT NULL
                                  CHECK (is_sage_field_family IN (
                                    'yes',
                                    'no',
                                    'interested'
                                  )),
  hear_about_us       TEXT,
  notes               TEXT,

  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN (
                                    'pending',
                                    'attended',
                                    'no_show',
                                    'cancelled'
                                  )),

  is_deleted          BOOLEAN     NOT NULL DEFAULT false,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_community_garden_day_rsvps_email
  ON marketing.community_garden_day_rsvps (email);

CREATE INDEX IF NOT EXISTS idx_marketing_community_garden_day_rsvps_created_at
  ON marketing.community_garden_day_rsvps (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_community_garden_day_rsvps_is_deleted
  ON marketing.community_garden_day_rsvps (is_deleted);

CREATE TRIGGER set_community_garden_day_rsvps_updated_at
  BEFORE UPDATE ON marketing.community_garden_day_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE marketing.community_garden_day_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to community_garden_day_rsvps"
  ON marketing.community_garden_day_rsvps
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Prevent public read of community_garden_day_rsvps"
  ON marketing.community_garden_day_rsvps
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Admins can read community_garden_day_rsvps"
  ON marketing.community_garden_day_rsvps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update community_garden_day_rsvps"
  ON marketing.community_garden_day_rsvps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can delete community_garden_day_rsvps"
  ON marketing.community_garden_day_rsvps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid())
  );

GRANT INSERT ON marketing.community_garden_day_rsvps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing.community_garden_day_rsvps TO authenticated;
GRANT ALL ON marketing.community_garden_day_rsvps TO service_role;
