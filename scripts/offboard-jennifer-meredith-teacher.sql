-- Offboard Jennifer Meredith — teacher account
-- Run in the Supabase SQL editor (production).
--
-- After this SQL succeeds, delete the Auth user in the Dashboard:
--   Authentication → Users → Meredith.jennifer@outlook.com → Delete
--
-- Soft-delete alone does not block sign-in; teacher layout checks role, not is_deleted.

UPDATE admin.users
SET is_deleted = true,
    updated_at = now()
WHERE id = '9a6ee628-ada7-4cee-9d92-d575499a5305';

-- Verify
SELECT id, email, full_name, role, is_deleted
FROM admin.users
WHERE id = '9a6ee628-ada7-4cee-9d92-d575499a5305';
