-- Fix: authenticated role could not upsert or update channel_members (missing UPDATE grant + RLS policy).
-- Mobile app uses client-side upsert for join/enroll and update for last_read_at.

GRANT UPDATE ON TABLE messaging.channel_members TO authenticated;

CREATE POLICY "channel_members_update_own"
  ON messaging.channel_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Backfill eligible enrolled parents into default community channels.
INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT DISTINCT ch.id, u.id
FROM messaging.channels ch
JOIN admin.users u ON u.role = 'parent' AND u.is_deleted = false
JOIN parent_app.applications a ON a.user_id = u.id AND a.status = 'enrolled'
WHERE ch.is_default = true
  AND NOT ('Don''t Include' = ANY(COALESCE(a.admin_tags, '{}')))
ON CONFLICT DO NOTHING;
