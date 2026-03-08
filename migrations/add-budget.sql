-- =====================================================
-- Budget Schema for Sagefield School
-- Run in Supabase SQL Editor (super_admin access only)
-- =====================================================

CREATE SCHEMA IF NOT EXISTS budget;

-- =====================================================
-- Helper function (may already exist)
-- =====================================================
-- is_super_admin: SECURITY DEFINER so authenticated role
-- can check admin.users without needing cross-schema grants.
CREATE OR REPLACE FUNCTION budget.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- GRANTs so authenticated role can reach the schema/tables
GRANT USAGE ON SCHEMA budget TO authenticated;
GRANT EXECUTE ON FUNCTION budget.is_super_admin() TO authenticated;

-- =====================================================
-- Trigger helper (may already exist)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- budget.line_items — Planned monthly budget
-- =====================================================
CREATE TABLE budget.line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  item_name     TEXT NOT NULL,
  planned_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE budget.line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_only_line_items"
  ON budget.line_items FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

CREATE TRIGGER set_line_items_updated_at
  BEFORE UPDATE ON budget.line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- budget.expenses — Actual expense transactions
-- =====================================================
CREATE TABLE budget.expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_name   TEXT NOT NULL,
  category       TEXT NOT NULL,
  amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  expense_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE budget.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_only_expenses"
  ON budget.expenses FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON budget.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- budget.income — Actual revenue entries
-- =====================================================
CREATE TABLE budget.income (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source       TEXT NOT NULL CHECK (source IN ('tuition','aftercare','fun_friday','summer','other')),
  student_name TEXT,
  description  TEXT,
  amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  income_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE budget.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_only_income"
  ON budget.income FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

CREATE TRIGGER set_income_updated_at
  BEFORE UPDATE ON budget.income
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- budget.settings — Key/value config
-- =====================================================
CREATE TABLE budget.settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT UNIQUE NOT NULL,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE budget.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_only_settings"
  ON budget.settings FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON budget.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Table-level GRANTs
-- =====================================================
GRANT ALL ON budget.line_items TO authenticated;
GRANT ALL ON budget.expenses   TO authenticated;
GRANT ALL ON budget.income     TO authenticated;
GRANT ALL ON budget.settings   TO authenticated;

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_budget_expenses_date ON budget.expenses(expense_date DESC);
CREATE INDEX idx_budget_expenses_category ON budget.expenses(category);
CREATE INDEX idx_budget_income_date ON budget.income(income_date DESC);
CREATE INDEX idx_budget_income_source ON budget.income(source);
CREATE INDEX idx_budget_line_items_category ON budget.line_items(category);
CREATE INDEX idx_budget_line_items_sort ON budget.line_items(sort_order);

-- =====================================================
-- Seed: budget.line_items (12 planned items)
-- =====================================================
INSERT INTO budget.line_items (category, item_name, planned_amount, sort_order, notes) VALUES
  -- Personnel
  ('Personnel', 'Staff 1 (Part-time)',          2240.00, 10, '112 hrs × $20/hr'),
  ('Personnel', 'Staff 2 (Part-time)',          3200.00, 20, '128 hrs × $25/hr'),
  ('Personnel', 'Owner Salary',                 2500.00, 30, 'Monthly draw'),
  -- Facilities
  ('Facilities', 'Rent / Lease',                1200.00, 40, 'Leo Property Management'),
  ('Facilities', 'Utilities',                    150.00, 50, 'Estimate'),
  ('Facilities', 'Cleaning Supplies',             75.00, 60, 'Monthly estimate'),
  -- Program
  ('Program', 'Curriculum & Materials',          300.00, 70, 'Books, consumables'),
  ('Program', 'Field Trips & Activities',        200.00, 80, 'Monthly estimate'),
  ('Program', 'Technology & Software',            80.00, 90, 'Zoho Mail $16 + tools'),
  -- Risk
  ('Risk', 'Liability Insurance',               250.00, 100, 'Annual ÷ 12'),
  ('Risk', 'LLC / Legal Fees',                   25.00, 110, '$300 annual ÷ 12'),
  -- Savings
  ('Savings', 'Emergency Fund Reserve',          500.00, 120, '~3% of revenue target');

-- =====================================================
-- Seed: budget.expenses (4 current expenses from records)
-- =====================================================
INSERT INTO budget.expenses (expense_name, category, amount, payment_method, expense_date, notes) VALUES
  ('Zoho Mail',        'Technology & Software', 16.00,  'Card',  '2026-03-01', 'Monthly email service'),
  ('LLC Registration', 'Risk',                  300.00, 'Check', '2026-01-15', 'Annual Texas LLC fee'),
  ('Walgreens Banner', 'Marketing',             35.00,  'Card',  '2026-02-10', 'Printed banner for enrollment'),
  ('Leo Property Mgmt','Facilities',            120.00, 'ACH',   '2026-03-01', 'Rent payment');

-- =====================================================
-- Seed: budget.settings (default config)
-- =====================================================
INSERT INTO budget.settings (key, value) VALUES
  ('federal_tax_rate',       '"21"'),
  ('tx_franchise_tax_rate',  '"0.375"'),
  ('enrollment', '{"full_14": 0, "full_primary": 0, "aftercare": 0, "fun_friday": 0, "summer": 0}');
