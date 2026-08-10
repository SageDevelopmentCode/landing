-- PTC bookings: grant authenticated access and allow dashboard grantees to read/insert
-- on behalf of the account owner (matches other parent_app grantee policies).
-- On production: run this file in the Supabase SQL editor if not applied via local db reset.

GRANT SELECT, INSERT ON teachers.parent_teacher_conference_bookings TO authenticated;

CREATE POLICY "Active grantee can view owner PTC bookings"
  ON teachers.parent_teacher_conference_bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_app.dashboard_access_grants g
      WHERE g.owner_id = parent_id
        AND g.grantee_id = auth.uid()
        AND g.status = 'active'
    )
  );

CREATE POLICY "Active grantee can insert owner PTC bookings"
  ON teachers.parent_teacher_conference_bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_app.dashboard_access_grants g
      WHERE g.owner_id = parent_id
        AND g.grantee_id = auth.uid()
        AND g.status = 'active'
    )
    AND EXISTS (
      SELECT 1 FROM admin.students s
      WHERE s.id = student_id
        AND s.parent_id = parent_id
        AND s.is_deleted = false
    )
  );
