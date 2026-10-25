-- Julius Cecilia — super admin account
-- Run in the Supabase SQL editor (production).
--
-- Prerequisite: create Auth user first in the Dashboard:
--   Authentication → Add user → julius@trymudkitchen.com
--   (confirm email / set password or send password reset)

-- Link admin.users
INSERT INTO admin.users (id, email, full_name, role, is_deleted)
SELECT au.id, au.email, 'Julius Cecilia', 'super_admin', false
FROM auth.users au
WHERE au.email ILIKE 'julius@trymudkitchen.com'
ON CONFLICT (id) DO UPDATE SET
  email      = EXCLUDED.email,
  full_name  = EXCLUDED.full_name,
  role       = 'super_admin',
  is_deleted = false,
  updated_at = now();

-- Verify admin.users
SELECT id, email, full_name, role, is_deleted, created_at
FROM admin.users
WHERE email ILIKE 'julius@trymudkitchen.com';
