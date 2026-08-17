-- ============================================
-- TEACHERS SCHEMA — Staff ID cards (super admin)
-- ============================================
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE TABLE IF NOT EXISTS teachers.teacher_id_cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES admin.users (id) ON DELETE SET NULL,
  full_name       TEXT        NOT NULL,
  title           TEXT        NOT NULL DEFAULT 'Teacher',
  grade_classroom TEXT,
  issue_year      INTEGER     NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  photo_url       TEXT,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  is_deleted      BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_id_cards_sort_order
  ON teachers.teacher_id_cards (sort_order, full_name);

CREATE INDEX IF NOT EXISTS idx_teacher_id_cards_user_id
  ON teachers.teacher_id_cards (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_teacher_id_cards_is_deleted
  ON teachers.teacher_id_cards (is_deleted);

CREATE TRIGGER set_teacher_id_cards_updated_at
  BEFORE UPDATE ON teachers.teacher_id_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE teachers.teacher_id_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_select_teacher_id_cards"
  ON teachers.teacher_id_cards
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_insert_teacher_id_cards"
  ON teachers.teacher_id_cards
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_update_teacher_id_cards"
  ON teachers.teacher_id_cards
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_delete_teacher_id_cards"
  ON teachers.teacher_id_cards
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON teachers.teacher_id_cards TO authenticated;
GRANT ALL ON teachers.teacher_id_cards TO service_role;

-- Storage bucket for ID card photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-id-photos', 'teacher-id-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read teacher id photos"
  ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'teacher-id-photos');

CREATE POLICY "Super admin upload teacher id photos"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-id-photos'
    AND public.is_super_admin()
  );

CREATE POLICY "Super admin update teacher id photos"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'teacher-id-photos'
    AND public.is_super_admin()
  )
  WITH CHECK (
    bucket_id = 'teacher-id-photos'
    AND public.is_super_admin()
  );

CREATE POLICY "Super admin delete teacher id photos"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'teacher-id-photos'
    AND public.is_super_admin()
  );

-- Default staff ID cards (skip if already seeded)
INSERT INTO teachers.teacher_id_cards (
  user_id,
  full_name,
  title,
  grade_classroom,
  issue_year,
  sort_order
)
SELECT *
FROM (
  VALUES
    (
      '6db16988-f41e-4249-b3fa-7b6720d11ac0'::uuid,
      'Sabrina Obnamia',
      'Lead Teacher',
      '3rd – 4th Grade',
      2026,
      1
    ),
    (
      'bd562de1-18c2-4b47-91d7-5f0b93fee107'::uuid,
      'Zelinda Melo',
      'Teacher',
      '1st – 2nd Grade',
      2026,
      2
    ),
    (
      '68709384-b054-4f38-a4ee-81554dad2eb8'::uuid,
      'Joy Paige',
      'Lead Teacher',
      'Pre-K – Kindergarten',
      2026,
      3
    )
) AS seed (user_id, full_name, title, grade_classroom, issue_year, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM teachers.teacher_id_cards
);
