-- Track when mobile payment Discord/email notifications were delivered.
-- Used to avoid skipping notifications when billing row exists but notify failed.
ALTER TABLE billing.stripe_transactions
  ADD COLUMN IF NOT EXISTS notifications_sent_at timestamptz;

COMMENT ON COLUMN billing.stripe_transactions.notifications_sent_at IS
  'When Discord + confirmation email were sent for this payment (mobile Payment Sheet path).';
