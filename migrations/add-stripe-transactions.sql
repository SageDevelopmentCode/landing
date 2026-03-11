CREATE SCHEMA IF NOT EXISTS billing;

CREATE TABLE billing.stripe_transactions (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id        TEXT        UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  payment_type             TEXT        NOT NULL,  -- 'registration_fee' | 'tuition' | 'donation' | 'payroll_invoice'
  status                   TEXT        NOT NULL DEFAULT 'completed',
  amount_cents             INTEGER     NOT NULL,
  intended_amount_cents    INTEGER,               -- base amount before fee grossing
  currency                 TEXT        NOT NULL DEFAULT 'usd',
  cover_fees               BOOLEAN     DEFAULT false,
  payer_name               TEXT,
  payer_email              TEXT,
  description              TEXT,                  -- e.g. "Summer 2026 Registration Fee"
  student_id               TEXT,
  application_id           TEXT,
  parent_id                TEXT,
  metadata                 JSONB       DEFAULT '{}',
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

-- RLS: only service role can access
ALTER TABLE billing.stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION billing.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_transactions_updated_at
  BEFORE UPDATE ON billing.stripe_transactions
  FOR EACH ROW EXECUTE FUNCTION billing.set_updated_at();

-- Indexes
CREATE INDEX ON billing.stripe_transactions (payment_type);
CREATE INDEX ON billing.stripe_transactions (payer_email);
CREATE INDEX ON billing.stripe_transactions (student_id);
CREATE INDEX ON billing.stripe_transactions (parent_id);
CREATE INDEX ON billing.stripe_transactions (created_at DESC);
