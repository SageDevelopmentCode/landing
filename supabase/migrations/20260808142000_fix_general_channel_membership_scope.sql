-- Remove non-enrolled parents from default community channels.
DELETE FROM messaging.channel_members cm
USING messaging.channels ch, admin.users u
WHERE cm.channel_id = ch.id
  AND ch.is_default = true
  AND u.id = cm.user_id
  AND u.role = 'parent'
  AND NOT EXISTS (
    SELECT 1 FROM parent_app.applications a
    WHERE a.user_id = u.id AND a.status = 'enrolled'
  );

-- Remove enrolled parents whose families are entirely "Don't Include".
DELETE FROM messaging.channel_members cm
USING messaging.channels ch, admin.users u
WHERE cm.channel_id = ch.id
  AND ch.is_default = true
  AND u.id = cm.user_id
  AND u.role = 'parent'
  AND NOT EXISTS (
    SELECT 1 FROM parent_app.applications a
    WHERE a.user_id = u.id
      AND a.status = 'enrolled'
      AND NOT ('Don''t Include' = ANY(COALESCE(a.admin_tags, '{}')))
  );

-- Ensure eligible enrolled parents are in default channels (idempotent).
INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT DISTINCT ch.id, u.id
FROM messaging.channels ch
JOIN admin.users u ON u.role = 'parent' AND u.is_deleted = false
JOIN parent_app.applications a ON a.user_id = u.id AND a.status = 'enrolled'
WHERE ch.is_default = true
  AND NOT ('Don''t Include' = ANY(COALESCE(a.admin_tags, '{}')))
ON CONFLICT DO NOTHING;
