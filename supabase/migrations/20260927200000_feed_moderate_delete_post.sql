-- Super admin: soft-delete any feed post (including auto-generated).
-- Run this in the Supabase SQL editor on production if not applied via local db reset.

CREATE OR REPLACE FUNCTION feed.moderate_delete_post(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = feed, admin, auth, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM admin.users u
    WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
      AND u.is_deleted = false
  ) THEN
    RAISE EXCEPTION 'Post not found or permission denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE feed.posts
  SET is_deleted = true,
      updated_at = now()
  WHERE id = p_post_id
    AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found or permission denied'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

ALTER FUNCTION feed.moderate_delete_post(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION feed.moderate_delete_post(uuid) TO authenticated;
