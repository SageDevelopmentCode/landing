-- Migration: add student_photo_release_consent table
CREATE TABLE parent_app.student_photo_release_consent (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID        NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
  student_id   UUID        NOT NULL REFERENCES admin.students(id) ON DELETE CASCADE,
  consent_level TEXT       NOT NULL CHECK (consent_level IN ('FULL', 'LIMITED', 'NO')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_photo_release_consent UNIQUE (parent_id, student_id)
);

ALTER TABLE parent_app.student_photo_release_consent ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "Admin full access to photo release consent"
  ON parent_app.student_photo_release_consent
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant service_role access (required for server actions using admin client)
GRANT USAGE ON SCHEMA parent_app TO service_role;
GRANT ALL ON TABLE parent_app.student_photo_release_consent TO service_role;
