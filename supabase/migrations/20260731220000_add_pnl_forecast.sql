-- =====================================================
-- P&L Forecast tables for Sage Field School
-- Run in Supabase SQL Editor (super_admin access only)
-- =====================================================

CREATE TABLE IF NOT EXISTS budget.pnl_forecasts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  school_year_key     text NOT NULL UNIQUE,
  months_in_year      integer NOT NULL DEFAULT 10,
  friday_addon_rate   numeric(10,2) NOT NULL DEFAULT 160,
  target_monthly_profit numeric(10,2) DEFAULT 0,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget.pnl_tuition_rows (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id       uuid NOT NULL REFERENCES budget.pnl_forecasts(id) ON DELETE CASCADE,
  student_name      text NOT NULL,
  program_label     text NOT NULL,
  monthly_amount    numeric(10,2) NOT NULL,
  has_friday_addon  boolean NOT NULL DEFAULT false,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget.pnl_revenue_extras (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id     uuid NOT NULL REFERENCES budget.pnl_forecasts(id) ON DELETE CASCADE,
  label           text NOT NULL,
  monthly_amount  numeric(10,2) NOT NULL DEFAULT 0,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget.pnl_expense_lines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id     uuid NOT NULL REFERENCES budget.pnl_forecasts(id) ON DELETE CASCADE,
  category        text NOT NULL,
  label           text NOT NULL,
  monthly_amount  numeric(10,2) NOT NULL DEFAULT 0,
  is_fixed        boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER set_pnl_forecasts_updated_at
  BEFORE UPDATE ON budget.pnl_forecasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_pnl_tuition_rows_updated_at
  BEFORE UPDATE ON budget.pnl_tuition_rows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_pnl_revenue_extras_updated_at
  BEFORE UPDATE ON budget.pnl_revenue_extras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_pnl_expense_lines_updated_at
  BEFORE UPDATE ON budget.pnl_expense_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE budget.pnl_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget.pnl_tuition_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget.pnl_revenue_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget.pnl_expense_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY super_admin_pnl_forecasts ON budget.pnl_forecasts
  FOR ALL USING (budget.is_super_admin()) WITH CHECK (budget.is_super_admin());

CREATE POLICY super_admin_pnl_tuition_rows ON budget.pnl_tuition_rows
  FOR ALL USING (budget.is_super_admin()) WITH CHECK (budget.is_super_admin());

CREATE POLICY super_admin_pnl_revenue_extras ON budget.pnl_revenue_extras
  FOR ALL USING (budget.is_super_admin()) WITH CHECK (budget.is_super_admin());

CREATE POLICY super_admin_pnl_expense_lines ON budget.pnl_expense_lines
  FOR ALL USING (budget.is_super_admin()) WITH CHECK (budget.is_super_admin());

GRANT ALL ON budget.pnl_forecasts TO authenticated;
GRANT ALL ON budget.pnl_tuition_rows TO authenticated;
GRANT ALL ON budget.pnl_revenue_extras TO authenticated;
GRANT ALL ON budget.pnl_expense_lines TO authenticated;

-- =====================================================
-- Seed: School Year 2026–27 forecast
-- =====================================================

INSERT INTO budget.pnl_forecasts (name, school_year_key, months_in_year, friday_addon_rate, target_monthly_profit)
VALUES ('School Year 2026–27', 'school_year_26_27', 10, 160, 1475)
ON CONFLICT (school_year_key) DO NOTHING;

DO $$
DECLARE
  fid uuid;
BEGIN
  SELECT id INTO fid FROM budget.pnl_forecasts WHERE school_year_key = 'school_year_26_27';
  IF fid IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM budget.pnl_tuition_rows WHERE forecast_id = fid LIMIT 1) THEN
    INSERT INTO budget.pnl_tuition_rows (forecast_id, student_name, program_label, monthly_amount, has_friday_addon, sort_order) VALUES
      (fid, 'claire',   'Full time 4-day',              1195, false,  1),
      (fid, 'hawk',     'Full time 4-day',              1195, false,  2),
      (fid, 'william',  'Full time 4-day',              1195, false,  3),
      (fid, 'dax',      'Full time 4-day',              1195, false,  4),
      (fid, 'iluka',    'Full time 4-day',              1195, false,  5),
      (fid, 'ellis',    'Full time 4-day',              1195, false,  6),
      (fid, 'steely',   'Full time 4-day',              1195, false,  7),
      (fid, 'grayson',  'Full time K-5',                1095, false,  8),
      (fid, 'nargis',   'Full time K-5',                1095, false,  9),
      (fid, 'sloane',   'Full time K-5',                1095, false, 10),
      (fid, 'rience',   'Full time K-5',                1095, false, 11),
      (fid, 'emerson',  'Full time K-5',                1095, false, 12),
      (fid, 'lorelei',  'Full time K-5',                1095, false, 13),
      (fid, 'thomas',   'Full time K-5',                1095, false, 14),
      (fid, 'calvin',   'Full time K-5',                1095, false, 15),
      (fid, 'noah',     'Full time K-5',                1095, false, 16),
      (fid, 'benjamin', 'Full time scholarship',         850, false, 17),
      (fid, 'gabe',     '1 day/week 4-1st + Friday',   640, true,  18),
      (fid, 'maple',    '1 day/week 4-1st',            480, false, 19),
      (fid, 'sable',    '1 day/week 4-1st',            480, false, 20),
      (fid, 'john',     '1 day/week 2nd-5th + Friday', 600, true,  21),
      (fid, 'elsie',    '1 day/week scholarship',      200, false, 22),
      (fid, 'martina',  '1 day/week scholarship',      200, false, 23),
      (fid, 'raven',    '2 days/week 4-1st',           560, false, 24),
      (fid, 'kalani',   '2 days/week 4-1st',           560, false, 25),
      (fid, 'dominic',  '2 days/week 2nd-5th',         520, false, 26);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM budget.pnl_expense_lines WHERE forecast_id = fid LIMIT 1) THEN
    INSERT INTO budget.pnl_expense_lines (forecast_id, category, label, monthly_amount, is_fixed, sort_order) VALUES
      (fid, 'payroll',    'Staff pay — Miss Zelinda', 4000, true,  1),
      (fid, 'payroll',    'Staff pay — Miss Joy',     4000, true,  2),
      (fid, 'payroll',    'Personal pay',             3000, true,  3),
      (fid, 'facilities', 'Rent',                     5000, true,  4),
      (fid, 'facilities', 'Utilities',                 500, true,  5),
      (fid, 'operations', 'Supplies',                  300, true,  6),
      (fid, 'operations', 'Insurance',                  30, true,  7),
      (fid, 'operations', 'Tech',                       30, true,  8),
      (fid, 'savings',    'Savings (tax)',            2000, true,  9),
      (fid, 'operations', 'Gardening',                 400, true, 10),
      (fid, 'operations', 'Pest control',               75, true, 11),
      (fid, 'operations', 'Marketing',                 500, true, 12);
  END IF;
END $$;
