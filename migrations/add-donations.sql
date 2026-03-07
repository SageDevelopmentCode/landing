CREATE SCHEMA IF NOT EXISTS donations;

CREATE TABLE donations.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  donor_name TEXT,
  donor_email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: public cannot read donations; admin service role bypasses RLS
ALTER TABLE donations.donations ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON donations.donations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for lookups
CREATE INDEX idx_donations_stripe_session ON donations.donations(stripe_session_id);
CREATE INDEX idx_donations_email ON donations.donations(donor_email);
CREATE INDEX idx_donations_created_at ON donations.donations(created_at DESC);
