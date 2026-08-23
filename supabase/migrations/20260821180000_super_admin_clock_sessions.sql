-- Super-admin access to all employee clock sessions (mobile Employee Hours admin screen).
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE POLICY "super_admin_select_clock_sessions"
  ON teachers.clock_sessions
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_insert_clock_sessions"
  ON teachers.clock_sessions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_update_clock_sessions"
  ON teachers.clock_sessions
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
