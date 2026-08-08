-- Parent-teacher conference bookings (school year 2026–27)
CREATE TABLE IF NOT EXISTS teachers.parent_teacher_conference_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES admin.students(id) ON DELETE CASCADE,
  teacher_id      uuid NOT NULL REFERENCES admin.users(id) ON DELETE RESTRICT,
  season          text NOT NULL DEFAULT 'school_year_26_27',
  week_start      date NOT NULL,
  conference_date date NOT NULL,
  time_slot       text NOT NULL,
  format          text NOT NULL CHECK (format IN ('in_person', 'virtual')),
  accommodation_note text,
  status          text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ptc_bookings_one_per_student
  ON teachers.parent_teacher_conference_bookings (student_id, season)
  WHERE status = 'confirmed';

CREATE UNIQUE INDEX IF NOT EXISTS ptc_bookings_teacher_slot_unique
  ON teachers.parent_teacher_conference_bookings (teacher_id, conference_date, time_slot)
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS ptc_bookings_parent_id_idx
  ON teachers.parent_teacher_conference_bookings (parent_id);

CREATE INDEX IF NOT EXISTS ptc_bookings_teacher_date_idx
  ON teachers.parent_teacher_conference_bookings (teacher_id, conference_date);

CREATE TRIGGER ptc_bookings_updated_at
  BEFORE UPDATE ON teachers.parent_teacher_conference_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE teachers.parent_teacher_conference_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ptc_bookings_parent_select
  ON teachers.parent_teacher_conference_bookings
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY ptc_bookings_parent_insert
  ON teachers.parent_teacher_conference_bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM admin.students s
      WHERE s.id = student_id
        AND s.parent_id = auth.uid()
        AND s.is_deleted = false
    )
  );

CREATE POLICY ptc_bookings_teacher_select
  ON teachers.parent_teacher_conference_bookings
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY ptc_bookings_admin_all
  ON teachers.parent_teacher_conference_bookings
  USING ((auth.jwt() ->> 'role') = 'admin');

GRANT ALL ON TABLE teachers.parent_teacher_conference_bookings TO service_role;
