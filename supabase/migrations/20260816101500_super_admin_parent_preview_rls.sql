-- Super-admin read access for mobile parent impersonation preview.
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE POLICY "super_admin_select_onboarding_checklist"
  ON parent_app.onboarding_checklist
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_dropoff_times"
  ON parent_app.dropoff_times
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_referrals"
  ON parent_app.referrals
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_default_preferences"
  ON parent_app.student_default_preferences
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_health_info"
  ON parent_app.student_health_info
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_health_statement"
  ON parent_app.student_health_statement
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_medication_plan"
  ON parent_app.student_medication_plan
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_photo_release_consent"
  ON parent_app.student_photo_release_consent
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_authorized_pickup_persons"
  ON parent_app.student_authorized_pickup_persons
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_student_authorized_pickup_plan"
  ON parent_app.student_authorized_pickup_plan
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_enrollment_signatures"
  ON parent_app.enrollment_signatures
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_select_ptc_bookings"
  ON teachers.parent_teacher_conference_bookings
  FOR SELECT TO authenticated
  USING (public.is_super_admin());
