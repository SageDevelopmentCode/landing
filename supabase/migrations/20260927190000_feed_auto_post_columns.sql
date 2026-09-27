-- Auto-generated notification-style feed posts (photos, activities, calendar, newsletter).

ALTER TABLE feed.posts
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_route text;

CREATE UNIQUE INDEX IF NOT EXISTS feed_posts_source_unique
  ON feed.posts (source_type, source_id)
  WHERE source_id IS NOT NULL AND is_deleted = false;

COMMENT ON COLUMN feed.posts.source_type IS 'manual|null, photo_batch, activity, calendar_event, newsletter';
COMMENT ON COLUMN feed.posts.cta_route IS 'Expo router path for mobile CTA (parent or staff variant set at insert time)';
