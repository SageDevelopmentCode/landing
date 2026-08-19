-- One confirmed booking per conference date + time slot (across all teachers)
DROP INDEX IF EXISTS teachers.ptc_bookings_teacher_slot_unique;

CREATE UNIQUE INDEX IF NOT EXISTS ptc_bookings_global_slot_unique
  ON teachers.parent_teacher_conference_bookings (conference_date, time_slot)
  WHERE status = 'confirmed';
