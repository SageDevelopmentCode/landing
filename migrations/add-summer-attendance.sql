CREATE TABLE IF NOT EXISTS attendance.summer_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE        NOT NULL,
  student_id   UUID        NOT NULL REFERENCES admin.students(id),
  recorded_by  UUID        NOT NULL REFERENCES admin.users(id),
  notes        TEXT,
  paid_for_day BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, student_id)
);

CREATE INDEX IF NOT EXISTS idx_summer_records_date
  ON attendance.summer_records (date);

CREATE INDEX IF NOT EXISTS idx_summer_records_student
  ON attendance.summer_records (student_id);

ALTER TABLE attendance.summer_records ENABLE ROW LEVEL SECURITY;
