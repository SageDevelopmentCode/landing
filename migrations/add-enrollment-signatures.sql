CREATE TABLE IF NOT EXISTS parent_app.enrollment_signatures (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID        NOT NULL,
  student_id   UUID        NOT NULL,
  contract_id  INTEGER     NOT NULL,
  section_id   INTEGER     NOT NULL,
  printed_name TEXT        NOT NULL,
  signature    TEXT        NOT NULL,
  signed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_enrollment_signature
    UNIQUE (parent_id, student_id, contract_id, section_id),

  CONSTRAINT fk_parent
    FOREIGN KEY (parent_id) REFERENCES admin.users(id) ON DELETE CASCADE,

  CONSTRAINT fk_student
    FOREIGN KEY (student_id) REFERENCES admin.students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrollment_signatures_lookup
  ON parent_app.enrollment_signatures (parent_id, student_id, contract_id);

ALTER TABLE parent_app.enrollment_signatures ENABLE ROW LEVEL SECURITY;
GRANT ALL ON parent_app.enrollment_signatures TO service_role;
