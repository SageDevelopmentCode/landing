-- Document channel_message auto feed source (columns already exist).
COMMENT ON COLUMN feed.posts.source_type IS 'manual|null, photo_batch, activity, calendar_event, newsletter, channel_message';
