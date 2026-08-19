-- Allow conference teachers to read all PTC bookings (peer visibility for staff mobile home).
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE POLICY ptc_bookings_conference_teacher_peer_select
  ON teachers.parent_teacher_conference_bookings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = ANY(ARRAY[
      '6db16988-f41e-4249-b3fa-7b6720d11ac0',
      'bd562de1-18c2-4b47-91d7-5f0b93fee107',
      '68709384-b054-4f38-a4ee-81554dad2eb8'
    ]::uuid[])
  );
