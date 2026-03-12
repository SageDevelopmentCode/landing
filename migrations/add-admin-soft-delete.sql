-- Soft delete for admin.users
ALTER TABLE admin.users
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_admin_users_is_deleted
  ON admin.users (is_deleted);

-- Soft delete for admin.students
ALTER TABLE admin.students
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_admin_students_is_deleted
  ON admin.students (is_deleted);
