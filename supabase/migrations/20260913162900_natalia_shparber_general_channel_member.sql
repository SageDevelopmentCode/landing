-- Immediate unblock for Natalia Shparber (nshparber@gmail.com).
-- Run manually in the Supabase SQL editor (production).
-- The backfill migration (20260913163000_backfill_grantee_default_channel_members.sql)
-- also covers this user; run either or both (ON CONFLICT DO NOTHING is safe).

INSERT INTO messaging.channel_members (channel_id, user_id)
SELECT ch.id, '0af93e4f-8902-475a-babb-b7f5b29e5197'::uuid
FROM messaging.channels ch
WHERE ch.is_default = true
ON CONFLICT DO NOTHING;
