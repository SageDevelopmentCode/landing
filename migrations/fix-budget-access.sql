-- =====================================================
-- Fix: Budget Schema Access Permissions
-- Run in Supabase SQL Editor after add-budget.sql
-- =====================================================
-- Also required (Dashboard only — no SQL):
--   Settings → API → Exposed schemas → add "budget"
-- =====================================================

-- 1. SECURITY DEFINER function
--    Runs as the table owner, bypasses RLS on admin.users
--    so authenticated users don't need cross-schema grants.
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

-- 2. GRANTs — allow authenticated role to reach the schema/tables
GRANT USAGE ON SCHEMA budget TO authenticated;
GRANT ALL ON budget.line_items TO authenticated;
GRANT ALL ON budget.expenses   TO authenticated;
GRANT ALL ON budget.income     TO authenticated;
GRANT ALL ON budget.settings   TO authenticated;
GRANT EXECUTE ON FUNCTION budget.is_super_admin() TO authenticated;

-- 3. Recreate RLS policies using the function
--    (old policies used a direct sub-select that fails without cross-schema grants)

DROP POLICY IF EXISTS "super_admin_only_line_items" ON budget.line_items;
CREATE POLICY "super_admin_only_line_items"
  ON budget.line_items FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

DROP POLICY IF EXISTS "super_admin_only_expenses" ON budget.expenses;
CREATE POLICY "super_admin_only_expenses"
  ON budget.expenses FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

DROP POLICY IF EXISTS "super_admin_only_income" ON budget.income;
CREATE POLICY "super_admin_only_income"
  ON budget.income FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());

DROP POLICY IF EXISTS "super_admin_only_settings" ON budget.settings;
CREATE POLICY "super_admin_only_settings"
  ON budget.settings FOR ALL
  USING (budget.is_super_admin())
  WITH CHECK (budget.is_super_admin());
