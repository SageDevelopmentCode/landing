-- Allow parents to read school year weekday attendance for their own students.
-- Run manually in the Supabase SQL editor for production.

CREATE POLICY "Parent can view own student school year attendance"
  ON attendance.school_year_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin.students s
      WHERE s.id = school_year_records.student_id
        AND s.parent_id = auth.uid()
        AND s.is_deleted = false
    )
  );
