-- Add soft delete support to budget.expenses
ALTER TABLE budget.expenses
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS expenses_is_deleted_idx ON budget.expenses (is_deleted);
