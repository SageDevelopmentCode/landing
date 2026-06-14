-- =====================================================================
-- BLOG SCHEMA
-- Sagefield School — Blog / Content Marketing
-- Paste this entire block into the Supabase SQL Editor and run it.
-- =====================================================================

-- ─── 1. Schema ────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS blogs;

GRANT USAGE ON SCHEMA blogs TO authenticated, service_role, anon;

-- ─── 2. Helper: reuse existing teacher/admin check ────────────────────────────

-- Reuses newsletters.is_teacher_or_admin() — no need to redefine.

-- ─── 3. blogs.blog_posts ──────────────────────────────────────────────────────

CREATE TABLE blogs.blog_posts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT        NOT NULL,
  slug                TEXT        NOT NULL UNIQUE,
  body                TEXT        NOT NULL DEFAULT '',
  excerpt             TEXT,
  cover_image_path    TEXT,
  cover_image_bucket  TEXT        CHECK (cover_image_bucket IN ('blog-images', 'teacher-photos')),
  status              TEXT        NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  created_by          UUID        NOT NULL REFERENCES auth.users(id),
  published_at        TIMESTAMPTZ,
  is_deleted          BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. updated_at trigger ────────────────────────────────────────────────────

CREATE TRIGGER set_blog_posts_updated_at
  BEFORE UPDATE ON blogs.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 5. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_blog_posts_slug       ON blogs.blog_posts(slug) WHERE is_deleted = false;
CREATE INDEX idx_blog_posts_status     ON blogs.blog_posts(status) WHERE is_deleted = false;
CREATE INDEX idx_blog_posts_created_by ON blogs.blog_posts(created_by);
CREATE INDEX idx_blog_posts_created_at ON blogs.blog_posts(created_at DESC);

-- ─── 6. Grants ────────────────────────────────────────────────────────────────

GRANT ALL ON blogs.blog_posts TO authenticated, service_role;
GRANT SELECT ON blogs.blog_posts TO anon;

-- ─── 7. Enable RLS ────────────────────────────────────────────────────────────

ALTER TABLE blogs.blog_posts ENABLE ROW LEVEL SECURITY;

-- ─── 8. RLS Policies ──────────────────────────────────────────────────────────

-- Public: anyone can read published posts
CREATE POLICY "public_read_published_posts"
  ON blogs.blog_posts FOR SELECT TO anon
  USING (status = 'published' AND is_deleted = false);

-- Teachers/admins: can read all (draft + published)
CREATE POLICY "teachers_read_posts"
  ON blogs.blog_posts FOR SELECT TO authenticated
  USING (is_deleted = false AND newsletters.is_teacher_or_admin());

-- Teachers/admins: can insert
CREATE POLICY "teachers_insert_posts"
  ON blogs.blog_posts FOR INSERT TO authenticated
  WITH CHECK (newsletters.is_teacher_or_admin() AND created_by = auth.uid());

-- Teachers/admins: can update
CREATE POLICY "teachers_update_posts"
  ON blogs.blog_posts FOR UPDATE TO authenticated
  USING (is_deleted = false AND newsletters.is_teacher_or_admin())
  WITH CHECK (newsletters.is_teacher_or_admin());
