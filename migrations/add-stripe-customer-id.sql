-- Add stripe_customer_id to admin.users for saved payment method support
ALTER TABLE admin.users
  ADD COLUMN stripe_customer_id TEXT UNIQUE;

CREATE INDEX idx_users_stripe_customer_id ON admin.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
