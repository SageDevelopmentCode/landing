-- Backfill default community channel membership for active dashboard grantees
-- whose grant owners have eligible enrolled applications.
-- Run manually in the Supabase SQL editor (production).

INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT DISTINCT ch.id, g.grantee_id
FROM messaging.channels ch
JOIN parent_app.dashboard_access_grants g ON g.status = 'active'
JOIN parent_app.applications a ON a.user_id = g.owner_id AND a.status = 'enrolled'
WHERE ch.is_default = true
  AND NOT ('Don''t Include' = ANY(COALESCE(a.admin_tags, '{}')))
ON CONFLICT DO NOTHING;
