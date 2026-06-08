CREATE TABLE IF NOT EXISTS billing.one_time_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT,
  payer_name        TEXT NOT NULL,
  payer_email       TEXT NOT NULL,
  payer_phone       TEXT,
  child_name        TEXT,
  child_age         INTEGER,
  memo              TEXT,
  amount_cents      INTEGER NOT NULL,
  cover_fees        BOOLEAN DEFAULT false,
  payment_status    TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS one_time_payments_email_idx
  ON billing.one_time_payments (payer_email);

CREATE INDEX IF NOT EXISTS one_time_payments_session_idx
  ON billing.one_time_payments (stripe_session_id);
