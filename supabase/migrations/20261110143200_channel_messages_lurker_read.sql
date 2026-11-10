-- Allow any authenticated user to read channel messages and reactions (lurker mode).
-- Sending still requires channel_members (existing INSERT policies).
-- Run manually in the Supabase SQL editor (production).

DROP POLICY IF EXISTS "channel_messages_read" ON messaging.channel_messages;

CREATE POLICY "channel_messages_read" ON messaging.channel_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM messaging.channels ch
      WHERE ch.id = channel_messages.channel_id
    )
  );

DROP POLICY IF EXISTS "message_reactions_read" ON messaging.message_reactions;

CREATE POLICY "message_reactions_read" ON messaging.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM messaging.channel_messages cm
      WHERE cm.id = message_reactions.message_id
    )
  );
