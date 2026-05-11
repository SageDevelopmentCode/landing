CREATE OR REPLACE FUNCTION public.get_channels_with_meta(p_user_id uuid)
RETURNS TABLE (
  channel_id uuid,
  name text,
  description text,
  is_default boolean,
  updated_at timestamptz,
  is_member boolean,
  member_count bigint,
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
    ch.id                         AS channel_id,
    ch.name,
    ch.description,
    ch.is_default,
    ch.updated_at,
    (cm.user_id IS NOT NULL)      AS is_member,
    (
      SELECT COUNT(*)
      FROM messaging.channel_members cm2
      WHERE cm2.channel_id = ch.id
    )                             AS member_count,
    lm.body                       AS last_message_body,
    lm.created_at                 AS last_message_created_at,
    lm.sender_id                  AS last_message_sender_id,
    CASE
      WHEN cm.user_id IS NULL THEN 0
      WHEN cm.last_read_at IS NULL THEN (
        SELECT COUNT(*)
        FROM messaging.channel_messages msg
        WHERE msg.channel_id = ch.id
          AND msg.sender_id != p_user_id
      )
      ELSE (
        SELECT COUNT(*)
        FROM messaging.channel_messages msg
        WHERE msg.channel_id = ch.id
          AND msg.sender_id != p_user_id
          AND msg.created_at > cm.last_read_at
      )
    END                           AS unread_count
  FROM messaging.channels ch
  LEFT JOIN messaging.channel_members cm
    ON cm.channel_id = ch.id AND cm.user_id = p_user_id
  LEFT JOIN LATERAL (
    SELECT body, created_at, sender_id
    FROM messaging.channel_messages msg
    WHERE msg.channel_id = ch.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) lm ON true
  ORDER BY ch.is_default DESC, ch.name ASC;
$$;
