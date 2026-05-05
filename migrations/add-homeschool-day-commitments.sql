CREATE TABLE billing.homeschool_day_commitments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id     UUID        NOT NULL REFERENCES admin.students(id) ON DELETE CASCADE,
  application_id UUID        NOT NULL REFERENCES parent_app.applications(id) ON DELETE CASCADE,
  note           TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT homeschool_day_commitments_unique UNIQUE (parent_id, student_id, application_id)
);

-- RLS: no authenticated/anon policies — service role only (consistent with billing.stripe_transactions)
ALTER TABLE billing.homeschool_day_commitments ENABLE ROW LEVEL SECURITY;

-- billing.set_updated_at() already exists (defined in add-stripe-transactions.sql)
CREATE TRIGGER homeschool_day_commitments_updated_at
  BEFORE UPDATE ON billing.homeschool_day_commitments
  FOR EACH ROW EXECUTE FUNCTION billing.set_updated_at();

CREATE INDEX ON billing.homeschool_day_commitments (parent_id);
CREATE INDEX ON billing.homeschool_day_commitments (student_id);
