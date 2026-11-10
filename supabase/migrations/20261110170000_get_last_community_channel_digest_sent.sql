-- Latest digest send per parent (avoids PostgREST 1k row cap on bulk log reads).
-- Run manually in the Supabase SQL editor (production).

CREATE OR REPLACE FUNCTION public.get_last_community_channel_digest_sent(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  sent_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, parent_app
AS $$
  SELECT DISTINCT ON (l.user_id)
    l.user_id,
    l.sent_at
  FROM parent_app.community_channel_digest_log l
  WHERE l.user_id = ANY(p_user_ids)
  ORDER BY l.user_id, l.sent_at DESC;
$$;

GRANT ALL ON FUNCTION public.get_last_community_channel_digest_sent(uuid[]) TO service_role;
