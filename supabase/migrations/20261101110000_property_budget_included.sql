ALTER TABLE admin.property_budget_items
  ADD COLUMN IF NOT EXISTS included_in_budget boolean NOT NULL DEFAULT true;
