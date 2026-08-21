-- Super-admin read access for mobile parent impersonation preview.
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE POLICY "super_admin_select_teacher_students"
  ON teachers.teacher_students
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
