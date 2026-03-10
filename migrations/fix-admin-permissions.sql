-- ============================================
-- Grant service_role permissions on admin schema
-- Required for redeem-code route to insert students
-- and update users with G1/G2 contact data
-- ============================================

-- Allow service_role to insert into admin.students
GRANT INSERT ON admin.students TO service_role;

-- Allow service_role to select from admin.students (for .select('id').single() after insert)
GRANT SELECT ON admin.students TO service_role;

-- Allow service_role to update admin.users (for G1/G2/custody fields)
GRANT UPDATE ON admin.users TO service_role;
