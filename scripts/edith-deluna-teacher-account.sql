-- Edith DeLuna — teacher account
-- Run in the Supabase SQL editor (production).
--
-- Prerequisite: create Auth user first in the Dashboard:
--   Authentication → Add user → edithdelunaa@gmail.com
--   (confirm email / send invite or password reset)

-- Link admin.users
INSERT INTO admin.users (id, email, full_name, role, is_deleted)
SELECT au.id, au.email, 'Edith DeLuna', 'teacher', false
FROM auth.users au
WHERE au.email ILIKE 'edithdelunaa@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email      = EXCLUDED.email,
  full_name  = EXCLUDED.full_name,
  role       = 'teacher',
  is_deleted = false,
  updated_at = now();

-- Verify admin.users
SELECT id, email, full_name, role, is_deleted, created_at
FROM admin.users
WHERE email ILIKE 'edithdelunaa@gmail.com';

-- Default community messaging channel
INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT ch.id, u.id
FROM messaging.channels ch
JOIN admin.users u ON u.email ILIKE 'edithdelunaa@gmail.com' AND u.is_deleted = false
WHERE ch.is_default = true
ON CONFLICT DO NOTHING;

-- Verify channel membership
SELECT ch.name, cm.user_id, u.full_name
FROM messaging.channel_members cm
JOIN messaging.channels ch ON ch.id = cm.channel_id
JOIN admin.users u ON u.id = cm.user_id
WHERE u.email ILIKE 'edithdelunaa@gmail.com';
