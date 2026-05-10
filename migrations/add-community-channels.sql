-- Community Channels: group chat support

CREATE TABLE messaging.channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user membership + read cursor
CREATE TABLE messaging.channel_members (
  channel_id   UUID NOT NULL REFERENCES messaging.channels(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (channel_id, user_id)
);

CREATE TABLE messaging.channel_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES messaging.channels(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES auth.users(id),
  body       TEXT NOT NULL DEFAULT '',
  image_url  TEXT,
  file_url   TEXT,
  file_name  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON messaging.channel_members (user_id);
CREATE INDEX ON messaging.channel_messages (channel_id, created_at);

-- RLS
ALTER TABLE messaging.channels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.channel_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.channel_messages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read channel metadata (public channels)
CREATE POLICY "channels_read" ON messaging.channels
  FOR SELECT TO authenticated USING (true);

-- Members can read their own membership rows
CREATE POLICY "channel_members_read_own" ON messaging.channel_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Members can read messages in channels they've joined
CREATE POLICY "channel_messages_read" ON messaging.channel_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messaging.channel_members
      WHERE channel_id = channel_messages.channel_id
        AND user_id = auth.uid()
    )
  );

-- All writes go through server actions using the admin client (bypasses RLS),
-- matching the existing pattern for createConversation and markMessagesRead.

-- Grants for service_role (tables created via SQL editor don't get these automatically)
GRANT USAGE ON SCHEMA messaging TO service_role;
GRANT ALL ON messaging.channels TO service_role;
GRANT ALL ON messaging.channel_members TO service_role;
GRANT ALL ON messaging.channel_messages TO service_role;

-- Seed the General channel.
-- IMPORTANT: replace <ADMIN_USER_ID> with a real super_admin user id before running.
INSERT INTO messaging.channels (name, description, is_default, created_by)
VALUES ('General', 'A channel for everyone at Sage Field School.', true, '<ADMIN_USER_ID>');
