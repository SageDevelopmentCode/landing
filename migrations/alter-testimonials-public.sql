ALTER TABLE marketing.testimonials
  ALTER COLUMN parent_id DROP NOT NULL;

ALTER TABLE marketing.testimonials
  ADD COLUMN IF NOT EXISTS feature_consent TEXT
    CHECK (feature_consent IN ('yes', 'ask'));

-- Allow anonymous inserts for public form
CREATE POLICY "anon_insert_testimonials"
  ON marketing.testimonials
  FOR INSERT
  TO anon
  WITH CHECK (parent_id IS NULL);
