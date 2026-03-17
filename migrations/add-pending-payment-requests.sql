-- Migration: add-pending-payment-requests
-- Creates billing.pending_payment_requests table for admin-to-parent payment notifications

CREATE TABLE billing.pending_payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id),
  student_id UUID REFERENCES admin.students(id),
  program TEXT NOT NULL,         -- 'summer_26' | 'school_year_26_27'
  payment_type TEXT NOT NULL,    -- matches ChecklistItem.payment_type
  week TEXT,                     -- nullable, e.g. '1'–'12'
  month TEXT,                    -- nullable, e.g. 'august'–'may'
  label TEXT NOT NULL,           -- display label e.g. "Week 3", "August"
  amount_cents INTEGER,          -- optional suggested amount
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'dismissed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS: parents can read their own rows; admins have full access via service role
ALTER TABLE billing.pending_payment_requests ENABLE ROW LEVEL SECURITY;

-- Parents can only see their own pending payment requests
CREATE POLICY "Parents can view own pending payment requests"
  ON billing.pending_payment_requests
  FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());
