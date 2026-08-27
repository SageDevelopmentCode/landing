-- Super admin: delete any school photo (teachers.photos + storage)
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE POLICY "super_admin_update_photos"
  ON teachers.photos
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_delete_photos"
  ON teachers.photos
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_delete_photo_tags"
  ON teachers.photo_student_tags
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_insert_photo_tags"
  ON teachers.photo_student_tags
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_delete_teacher_photos"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'teacher-photos'
    AND public.is_super_admin()
  );
