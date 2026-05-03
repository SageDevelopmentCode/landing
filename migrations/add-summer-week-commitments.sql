CREATE TABLE billing.summer_week_commitments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id     UUID        NOT NULL REFERENCES admin.students(id) ON DELETE CASCADE,
  application_id UUID        NOT NULL REFERENCES parent_app.applications(id) ON DELETE CASCADE,
  note           TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT summer_week_commitments_unique UNIQUE (parent_id, student_id, application_id)
);

-- RLS: no authenticated/anon policies — service role only (consistent with billing.stripe_transactions)
ALTER TABLE billing.summer_week_commitments ENABLE ROW LEVEL SECURITY;

-- billing.set_updated_at() already exists (defined in add-stripe-transactions.sql)
CREATE TRIGGER summer_week_commitments_updated_at
  BEFORE UPDATE ON billing.summer_week_commitments
  FOR EACH ROW EXECUTE FUNCTION billing.set_updated_at();

CREATE INDEX ON billing.summer_week_commitments (parent_id);
CREATE INDEX ON billing.summer_week_commitments (student_id);
