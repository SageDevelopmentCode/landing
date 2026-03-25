-- Messaging schema
-- Run this if the messaging schema was not yet created in your Supabase instance.
-- If you created it via the Supabase UI, you only need the RLS policy block at the bottom.

CREATE SCHEMA IF NOT EXISTS messaging;

-- Conversations
CREATE TABLE IF NOT EXISTS messaging.conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS messaging.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES messaging.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_user_id ON messaging.conversation_participants(user_id);

-- Messages
CREATE TABLE IF NOT EXISTS messaging.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES messaging.conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ          -- NULL = unread by the recipient
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messaging.messages(conversation_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE messaging.conversations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.messages                 ENABLE ROW LEVEL SECURITY;

-- Conversations: visible to participants
CREATE POLICY "participants can view conversations"
  ON messaging.conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM messaging.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Conversation participants: users can see their own rows
CREATE POLICY "users can view participants"
  ON messaging.conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM messaging.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Messages: participants can read
CREATE POLICY "participants can read messages"
  ON messaging.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM messaging.conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Messages: sender can insert
CREATE POLICY "sender can insert messages"
  ON messaging.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Messages: participants can mark incoming messages as read (update read_at only)
-- Without this policy, markMessagesRead silently fails because the user can't
-- update rows where sender_id != auth.uid(). The app works around this by using
-- the service role client in markMessagesRead, but this policy makes it correct
-- at the RLS level too.
CREATE POLICY "participants can mark messages read"
  ON messaging.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT conversation_id FROM messaging.conversation_participants
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (true);
