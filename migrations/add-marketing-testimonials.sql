-- ============================================
-- MARKETING SCHEMA — Testimonials Table
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: marketing.testimonials
-- ============================================
CREATE TABLE IF NOT EXISTS marketing.testimonials (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitter
  parent_id      UUID        NOT NULL,
  parent_name    TEXT        NOT NULL,
  parent_email   TEXT        NOT NULL,
  child_name     TEXT        NOT NULL,

  -- Content
  testimonial    TEXT        NOT NULL,

  -- Admin workflow
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'featured', 'declined')),
  gift_card_sent BOOLEAN     NOT NULL DEFAULT false,
  admin_notes    TEXT,

  -- Soft delete
  is_deleted     BOOLEAN     NOT NULL DEFAULT false,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON marketing.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS testimonials_parent_id_idx  ON marketing.testimonials (parent_id);
CREATE INDEX IF NOT EXISTS testimonials_status_idx     ON marketing.testimonials (status);
CREATE INDEX IF NOT EXISTS testimonials_created_at_idx ON marketing.testimonials (created_at DESC);

-- RLS
ALTER TABLE marketing.testimonials ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all_testimonials"
  ON marketing.testimonials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated parents can insert their own
CREATE POLICY "authenticated_insert_testimonials"
  ON marketing.testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Authenticated parents can read their own
CREATE POLICY "authenticated_select_own_testimonials"
  ON marketing.testimonials
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid() AND is_deleted = false);

-- Grants
GRANT USAGE ON SCHEMA marketing TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON marketing.testimonials TO authenticated;
GRANT ALL ON marketing.testimonials TO service_role;
