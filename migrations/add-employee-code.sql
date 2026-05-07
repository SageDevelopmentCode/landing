-- Add employee_code column to admin.users for PIN-based timeclock kiosk
ALTER TABLE admin.users
  ADD COLUMN IF NOT EXISTS employee_code TEXT;

ALTER TABLE admin.users
  ADD CONSTRAINT chk_employee_code_format
    CHECK (employee_code IS NULL OR (employee_code ~ '^\d{5}$'));

-- Unique partial index: allows multiple NULL values (teachers without codes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_employee_code
  ON admin.users (employee_code)
  WHERE employee_code IS NOT NULL;
