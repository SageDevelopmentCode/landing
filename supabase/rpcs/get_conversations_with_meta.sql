CREATE OR REPLACE FUNCTION public.get_conversations_with_meta(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  updated_at timestamptz,
  other_user_id uuid,
  other_full_name text,
  other_role text,
  other_profile_image_url text,
  last_message_body text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id                          AS conversation_id,
    c.updated_at,
    ou.id                         AS other_user_id,
    ou.full_name                  AS other_full_name,
    ou.role                       AS other_role,
    COALESCE(
      ou.profile_image_url,
      CASE WHEN ou.role = 'parent'
        THEN (
          SELECT s.profile_image_url
          FROM admin.students s
          WHERE s.parent_id = ou.id
            AND s.is_deleted = false
            AND s.profile_image_url IS NOT NULL
          LIMIT 1
        )
      END
    )                             AS other_profile_image_url,
    lm.body                       AS last_message_body,
    lm.created_at                 AS last_message_created_at,
    lm.sender_id                  AS last_message_sender_id,
    (
      SELECT COUNT(*)
      FROM messaging.messages m2
      WHERE m2.conversation_id = c.id
        AND m2.sender_id != p_user_id
        AND m2.read_at IS NULL
    )                             AS unread_count
  FROM messaging.conversation_participants cp
  JOIN messaging.conversations c ON c.id = cp.conversation_id
  JOIN messaging.conversation_participants cp2
    ON cp2.conversation_id = c.id AND cp2.user_id != p_user_id
  JOIN admin.users ou ON ou.id = cp2.user_id
  LEFT JOIN LATERAL (
    SELECT body, created_at, sender_id
    FROM messaging.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE cp.user_id = p_user_id
  ORDER BY lm.created_at DESC NULLS LAST;
$$;
