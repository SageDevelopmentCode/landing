-- =====================================================================
-- CARE LOG SCHEMA
-- Sagefield School — Sunscreen & Bug Spray Tracking
-- Paste this entire block into the Supabase SQL Editor and run it.
-- =====================================================================

-- ─── 1. Schema ─────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS care_log;

-- ─── 2. Role helper function ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION care_log.is_teacher_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'super_admin')
      AND is_deleted = false
  );
$$;

GRANT USAGE ON SCHEMA care_log TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION care_log.is_teacher_or_admin() TO authenticated;

-- ─── 3. care_log.entries ───────────────────────────────────────────────────────
-- Append-only event log. Multiple rows per student per day are valid
-- (e.g. sunscreen applied before recess and again after lunch).

CREATE TABLE care_log.entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES admin.students(id),
  activity    TEXT        NOT NULL CHECK (activity IN ('sunscreen', 'bug_spray')),
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  logged_by   UUID        NOT NULL REFERENCES admin.users(id),
  date        DATE        NOT NULL,
  notes       TEXT
);

-- ─── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_care_log_entries_date         ON care_log.entries (date);
CREATE INDEX idx_care_log_entries_student_date ON care_log.entries (student_id, date);

-- ─── 5. Grants ─────────────────────────────────────────────────────────────────

GRANT ALL ON care_log.entries TO authenticated, service_role;

-- ─── 6. Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE care_log.entries ENABLE ROW LEVEL SECURITY;

-- ─── 7. RLS policies ───────────────────────────────────────────────────────────

CREATE POLICY "teachers_read_entries"
  ON care_log.entries FOR SELECT TO authenticated
  USING (care_log.is_teacher_or_admin());

CREATE POLICY "teachers_insert_entries"
  ON care_log.entries FOR INSERT TO authenticated
  WITH CHECK (care_log.is_teacher_or_admin() AND logged_by = auth.uid());
