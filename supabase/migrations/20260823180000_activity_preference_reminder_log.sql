CREATE TABLE IF NOT EXISTS parent_app.activity_preference_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES admin.students(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES teachers.activities(id) ON DELETE CASCADE,
  days_before smallint NOT NULL CHECK (days_before IN (1, 2)),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, activity_id, days_before)
);

ALTER TABLE parent_app.activity_preference_reminder_log ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE parent_app.activity_preference_reminder_log TO service_role;
