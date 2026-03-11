-- student_medication_plan: one row per student (emergency procedure + special instructions)
CREATE TABLE parent_app.student_medication_plan (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id             UUID NOT NULL,
  student_id            UUID NOT NULL,
  emergency_procedure   TEXT,
  special_instructions  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_id, student_id),
  FOREIGN KEY (parent_id) REFERENCES admin.users(id),
  FOREIGN KEY (student_id) REFERENCES admin.students(id)
);

-- student_medications: many rows per student (one per medication)
CREATE TABLE parent_app.student_medications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id         UUID NOT NULL,
  student_id        UUID NOT NULL,
  medication_name   TEXT NOT NULL,
  condition_reason  TEXT,
  dosage_frequency  TEXT,
  physician_name    TEXT,
  physician_phone   TEXT,
  expiration_date   TEXT,
  is_daily          BOOLEAN DEFAULT FALSE,
  is_emergency_only BOOLEAN DEFAULT FALSE,
  sort_order        INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (parent_id) REFERENCES admin.users(id),
  FOREIGN KEY (student_id) REFERENCES admin.students(id)
);

GRANT ALL ON parent_app.student_medication_plan TO service_role;
GRANT ALL ON parent_app.student_medications TO service_role;
