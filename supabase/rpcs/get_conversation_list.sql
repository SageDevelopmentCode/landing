DROP FUNCTION IF EXISTS public.get_conversation_list(uuid);

CREATE OR REPLACE FUNCTION public.get_conversation_list(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_profile_image text,
  last_message_preview text,
  last_message_at timestamptz,
  unread_count bigint,
  is_group boolean,
  display_name text,
  student_id uuid,
  teacher_id uuid,
  participant_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = messaging, admin, parent_app, public
AS $$
  WITH my_convs AS (
    SELECT conversation_id
    FROM messaging.conversation_participants
    WHERE user_id = p_user_id
  ),
  last_msgs AS (
    SELECT DISTINCT ON (conversation_id)
      conversation_id, body, created_at
    FROM messaging.messages
    WHERE conversation_id IN (SELECT conversation_id FROM my_convs)
    ORDER BY conversation_id, created_at DESC
  ),
  unread AS (
    SELECT conversation_id, COUNT(*) AS cnt
    FROM messaging.messages
    WHERE conversation_id IN (SELECT conversation_id FROM my_convs)
      AND sender_id <> p_user_id
      AND read_at IS NULL
    GROUP BY conversation_id
  )
  SELECT
    c.id,
    CASE WHEN c.kind = 'household_teacher' THEN NULL ELSE ou.id END AS other_user_id,
    CASE
      WHEN c.kind = 'household_teacher' THEN (
        SELECT TRIM(
          COALESCE(st.child_legal_name, 'Student')
          || ' · '
          || COALESCE(tu.full_name, 'Teacher')
        )
        FROM admin.students st
        LEFT JOIN admin.users tu ON tu.id = c.teacher_id
        WHERE st.id = c.student_id
      )
      ELSE ou.full_name
    END AS other_user_name,
    CASE WHEN c.kind = 'household_teacher' THEN NULL ELSE ou.profile_image_url END AS other_user_profile_image,
    lm.body AS last_message_preview,
    COALESCE(lm.created_at, c.updated_at) AS last_message_at,
    COALESCE(ur.cnt, 0) AS unread_count,
    (c.kind = 'household_teacher') AS is_group,
    CASE
      WHEN c.kind = 'household_teacher' THEN (
        SELECT TRIM(
          COALESCE(st.child_legal_name, 'Student')
          || ' · '
          || COALESCE(tu.full_name, 'Teacher')
        )
        FROM admin.students st
        LEFT JOIN admin.users tu ON tu.id = c.teacher_id
        WHERE st.id = c.student_id
      )
      ELSE NULL
    END AS display_name,
    c.student_id,
    c.teacher_id,
    (
      SELECT COUNT(*)
      FROM messaging.conversation_participants cp3
      WHERE cp3.conversation_id = c.id
    ) AS participant_count
  FROM messaging.conversations c
  JOIN my_convs mc ON mc.conversation_id = c.id
  LEFT JOIN LATERAL (
    SELECT cp2.user_id
    FROM messaging.conversation_participants cp2
    WHERE cp2.conversation_id = c.id
      AND cp2.user_id <> p_user_id
    ORDER BY cp2.user_id
    LIMIT 1
  ) other_part ON c.kind <> 'household_teacher'
  LEFT JOIN admin.users ou ON ou.id = other_part.user_id
  LEFT JOIN last_msgs lm ON lm.conversation_id = c.id
  LEFT JOIN unread ur ON ur.conversation_id = c.id
  ORDER BY COALESCE(lm.created_at, c.updated_at) DESC;
$$;
