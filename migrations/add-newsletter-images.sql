-- =====================================================================
-- NEWSLETTER IMAGES
-- Sage Field School — Section image storage for newsletters
-- Paste this entire block into the Supabase SQL Editor and run it.
-- =====================================================================

-- ─── 1. newsletters.section_images ───────────────────────────────────────────

CREATE TABLE newsletters.section_images (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id   UUID        NOT NULL REFERENCES newsletters.sections(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  uploaded_by  UUID        NOT NULL REFERENCES auth.users(id),
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_deleted   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_nl_section_images_section_id ON newsletters.section_images(section_id) WHERE is_deleted = false;

-- ─── 3. Grants ────────────────────────────────────────────────────────────────

GRANT ALL ON newsletters.section_images TO authenticated, service_role;

-- ─── 4. Enable RLS ────────────────────────────────────────────────────────────

ALTER TABLE newsletters.section_images ENABLE ROW LEVEL SECURITY;

-- ─── 5. RLS policies ──────────────────────────────────────────────────────────

CREATE POLICY "teachers_read_section_images"
  ON newsletters.section_images FOR SELECT TO authenticated
  USING (is_deleted = false AND newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_insert_section_images"
  ON newsletters.section_images FOR INSERT TO authenticated
  WITH CHECK (newsletters.is_teacher_or_admin() AND uploaded_by = auth.uid());

CREATE POLICY "teachers_softdelete_section_images"
  ON newsletters.section_images FOR UPDATE TO authenticated
  USING (newsletters.is_teacher_or_admin())
  WITH CHECK (newsletters.is_teacher_or_admin());

-- ─── 6. Storage Bucket: newsletter-images ─────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'newsletter-images',
  'newsletter-images',
  false,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic']
);

CREATE POLICY "teachers_upload_newsletter_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'newsletter-images' AND newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_read_newsletter_images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'newsletter-images' AND newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_delete_newsletter_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'newsletter-images' AND newsletters.is_teacher_or_admin());
