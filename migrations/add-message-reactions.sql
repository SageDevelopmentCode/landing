CREATE TABLE IF NOT EXISTS messaging.message_reactions (
  message_id UUID NOT NULL REFERENCES messaging.channel_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON messaging.message_reactions (message_id);
