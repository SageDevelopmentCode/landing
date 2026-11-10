-- Lurker read: authenticated users may read messages in non-default channels without joining.
-- Default channels (e.g. General) still require channel_members — see fix_general_channel_membership_scope.
-- Sending still requires channel_members (existing INSERT policies).
--
-- Run manually in the Supabase SQL editor (production). Do not apply via MCP on hosted Sage Field.
-- If an older version of this migration (channel EXISTS only) is already live, re-run this file to replace policies.

DROP POLICY IF EXISTS "channel_messages_read" ON messaging.channel_messages;

CREATE POLICY "channel_messages_read" ON messaging.channel_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM messaging.channel_members cm
      WHERE cm.channel_id = channel_messages.channel_id
        AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM messaging.channels ch
      WHERE ch.id = channel_messages.channel_id
        AND ch.is_default = false
    )
  );

DROP POLICY IF EXISTS "message_reactions_read" ON messaging.message_reactions;

CREATE POLICY "message_reactions_read" ON messaging.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM messaging.channel_messages cm
      JOIN messaging.channels ch ON ch.id = cm.channel_id
      WHERE cm.id = message_reactions.message_id
        AND (
          EXISTS (
            SELECT 1
            FROM messaging.channel_members mem
            WHERE mem.channel_id = cm.channel_id
              AND mem.user_id = auth.uid()
          )
          OR ch.is_default = false
        )
    )
  );

-- Verification (run as an ineligible parent JWT / test user without default channel_membership):
--   General: SELECT * FROM messaging.channel_messages WHERE channel_id = <default_id> LIMIT 1;  -> 0 rows
--   Classroom (non-default), not a member: same query with that channel_id -> rows visible
--   Eligible member on General: messages and reactions readable
