-- Attendance schema
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- Create attendance schema
CREATE SCHEMA IF NOT EXISTS attendance;

-- Check-in events table
CREATE TABLE IF NOT EXISTS attendance.check_ins (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID        NOT NULL REFERENCES admin.students(id),
  checked_in_by  UUID        NOT NULL REFERENCES admin.users(id),  -- parent (or staff) who tapped confirm
  checked_in_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,                                       -- NULL = still checked in
  notes          TEXT,
  is_deleted     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup of today's check-ins per student
CREATE INDEX IF NOT EXISTS idx_check_ins_student_date
  ON attendance.check_ins (student_id, checked_in_at DESC);

-- Index for "who is currently checked in" queries
CREATE INDEX IF NOT EXISTS idx_check_ins_open
  ON attendance.check_ins (checked_out_at)
  WHERE checked_out_at IS NULL AND is_deleted = FALSE;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE attendance.check_ins ENABLE ROW LEVEL SECURITY;

-- Parents can read their own children's check-ins
CREATE POLICY "parents_read_own_checkins" ON attendance.check_ins
  FOR SELECT USING (
    checked_in_by = auth.uid()
  );

-- Parents can insert check-ins for their own children
CREATE POLICY "parents_insert_checkins" ON attendance.check_ins
  FOR INSERT WITH CHECK (
    checked_in_by = auth.uid()
  );

-- Admins have full access via service role (no extra policy needed)
