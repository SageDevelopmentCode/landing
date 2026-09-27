-- Jennifer Meredith — teacher account
-- Run in the Supabase SQL editor (production) if auth user already exists.
-- Prerequisite: auth user for Meredith.jennifer@outlook.com must exist first.

INSERT INTO admin.users (
  id,
  email,
  full_name,
  role,
  is_deleted
)
SELECT
  au.id,
  au.email,
  'Jennifer Meredith',
  'teacher',
  false
FROM auth.users au
WHERE au.email ILIKE 'Meredith.jennifer@outlook.com'
ON CONFLICT (id) DO UPDATE SET
  email      = EXCLUDED.email,
  full_name  = EXCLUDED.full_name,
  role       = EXCLUDED.role,
  is_deleted = false,
  updated_at = now();

-- Verify
SELECT id, email, full_name, role, is_deleted, created_at
FROM admin.users
WHERE email ILIKE 'Meredith.jennifer@outlook.com';
