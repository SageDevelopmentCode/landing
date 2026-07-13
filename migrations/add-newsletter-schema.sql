-- =====================================================================
-- NEWSLETTER SCHEMA
-- Sage Field School — Weekly Newsletter Builder
-- Paste this entire block into the Supabase SQL Editor and run it.
-- =====================================================================

-- ─── 1. Schema ────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS newsletters;

-- ─── 2. Role helper functions ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION newsletters.is_teacher_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'super_admin')
      AND is_deleted = false
  );
$$;

GRANT USAGE ON SCHEMA newsletters TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION newsletters.is_teacher_or_admin() TO authenticated;

-- ─── 3. newsletters.newsletters ───────────────────────────────────────────────

CREATE TABLE newsletters.newsletters (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  week_range   TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published')),
  view_mode    TEXT        NOT NULL DEFAULT 'traditional'
                 CHECK (view_mode IN ('traditional', 'slideshow')),
  created_by   UUID        NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  is_deleted   BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. newsletters.sections ──────────────────────────────────────────────────

CREATE TABLE newsletters.sections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id    UUID        NOT NULL REFERENCES newsletters.newsletters(id) ON DELETE CASCADE,
  label            TEXT        NOT NULL,
  body             TEXT        NOT NULL DEFAULT '',
  visible          BOOLEAN     NOT NULL DEFAULT true,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  is_class_updates BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. newsletters.teacher_updates ──────────────────────────────────────────
-- One row per teacher per class-updates section.

CREATE TABLE newsletters.teacher_updates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID        NOT NULL REFERENCES newsletters.sections(id) ON DELETE CASCADE,
  teacher_id UUID        NOT NULL REFERENCES auth.users(id),
  body       TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_id, teacher_id)
);

-- ─── 6. newsletters.change_log ────────────────────────────────────────────────
-- Append-only audit entries. No UPDATE/DELETE policies.

CREATE TABLE newsletters.change_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID        NOT NULL REFERENCES newsletters.newsletters(id) ON DELETE CASCADE,
  teacher_id    UUID        NOT NULL REFERENCES auth.users(id),
  summary       TEXT[]      NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. updated_at triggers ───────────────────────────────────────────────────

CREATE TRIGGER set_newsletters_updated_at
  BEFORE UPDATE ON newsletters.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_newsletters_sections_updated_at
  BEFORE UPDATE ON newsletters.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_newsletters_teacher_updates_updated_at
  BEFORE UPDATE ON newsletters.teacher_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 8. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_newsletters_is_deleted    ON newsletters.newsletters(is_deleted);
CREATE INDEX idx_newsletters_status        ON newsletters.newsletters(status) WHERE is_deleted = false;
CREATE INDEX idx_newsletters_created_by    ON newsletters.newsletters(created_by);
CREATE INDEX idx_newsletters_created_at    ON newsletters.newsletters(created_at DESC);
CREATE INDEX idx_nl_sections_newsletter_id ON newsletters.sections(newsletter_id);
CREATE INDEX idx_nl_sections_sort_order    ON newsletters.sections(newsletter_id, sort_order);
CREATE INDEX idx_nl_teacher_updates_sec    ON newsletters.teacher_updates(section_id);
CREATE INDEX idx_nl_change_log_nl_id       ON newsletters.change_log(newsletter_id, created_at DESC);

-- ─── 9. Grants ────────────────────────────────────────────────────────────────

GRANT ALL ON newsletters.newsletters     TO authenticated, service_role;
GRANT ALL ON newsletters.sections        TO authenticated, service_role;
GRANT ALL ON newsletters.teacher_updates TO authenticated, service_role;
GRANT ALL ON newsletters.change_log      TO authenticated, service_role;

-- ─── 10. Enable RLS ───────────────────────────────────────────────────────────

ALTER TABLE newsletters.newsletters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters.sections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters.teacher_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters.change_log      ENABLE ROW LEVEL SECURITY;

-- ─── 11. RLS: newsletters.newsletters ────────────────────────────────────────

CREATE POLICY "teachers_read_newsletters"
  ON newsletters.newsletters FOR SELECT TO authenticated
  USING (is_deleted = false AND newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_insert_newsletters"
  ON newsletters.newsletters FOR INSERT TO authenticated
  WITH CHECK (newsletters.is_teacher_or_admin() AND created_by = auth.uid());

CREATE POLICY "teachers_update_newsletters"
  ON newsletters.newsletters FOR UPDATE TO authenticated
  USING (is_deleted = false AND newsletters.is_teacher_or_admin())
  WITH CHECK (newsletters.is_teacher_or_admin());

-- ─── 12. RLS: newsletters.sections ───────────────────────────────────────────

CREATE POLICY "teachers_read_sections"
  ON newsletters.sections FOR SELECT TO authenticated
  USING (newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_insert_sections"
  ON newsletters.sections FOR INSERT TO authenticated
  WITH CHECK (newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_update_sections"
  ON newsletters.sections FOR UPDATE TO authenticated
  USING (newsletters.is_teacher_or_admin())
  WITH CHECK (newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_delete_sections"
  ON newsletters.sections FOR DELETE TO authenticated
  USING (newsletters.is_teacher_or_admin());

-- ─── 13. RLS: newsletters.teacher_updates ────────────────────────────────────

CREATE POLICY "teachers_read_teacher_updates"
  ON newsletters.teacher_updates FOR SELECT TO authenticated
  USING (newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_insert_teacher_updates"
  ON newsletters.teacher_updates FOR INSERT TO authenticated
  WITH CHECK (newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_update_teacher_updates"
  ON newsletters.teacher_updates FOR UPDATE TO authenticated
  USING (newsletters.is_teacher_or_admin())
  WITH CHECK (newsletters.is_teacher_or_admin());

-- ─── 14. RLS: newsletters.change_log ─────────────────────────────────────────

CREATE POLICY "teachers_read_change_log"
  ON newsletters.change_log FOR SELECT TO authenticated
  USING (newsletters.is_teacher_or_admin());

CREATE POLICY "teachers_insert_change_log"
  ON newsletters.change_log FOR INSERT TO authenticated
  WITH CHECK (newsletters.is_teacher_or_admin() AND teacher_id = auth.uid());

-- No UPDATE or DELETE policies — append-only is enforced at the RLS layer.
