-- Log for community channel unread digest emails (dedupe: only send when new messages since last send).
-- Run manually in the Supabase SQL editor (production).

CREATE TABLE IF NOT EXISTS parent_app.community_channel_digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  message_count integer NOT NULL DEFAULT 0,
  channel_ids uuid[] NOT NULL DEFAULT '{}'::uuid[]
);

CREATE INDEX IF NOT EXISTS community_channel_digest_log_user_id_sent_at_idx
  ON parent_app.community_channel_digest_log (user_id, sent_at DESC);

ALTER TABLE parent_app.community_channel_digest_log ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE parent_app.community_channel_digest_log TO service_role;
