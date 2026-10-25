-- One open (not clocked out) session per teacher.
--
-- Apply in production ONLY after:
--   1. Deploying the timeclock duplicate clock-in fix (idempotent clockInByUserId + UI pending state).
--   2. Resolving any teachers with multiple open sessions (index creation fails otherwise).
--
-- Pre-check (run in Supabase SQL editor):
--   SELECT teacher_id, count(*)
--   FROM teachers.clock_sessions
--   WHERE clock_out_at IS NULL
--   GROUP BY teacher_id
--   HAVING count(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS clock_sessions_one_active_per_teacher
  ON teachers.clock_sessions (teacher_id)
  WHERE clock_out_at IS NULL;
