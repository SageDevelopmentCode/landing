-- Required when return type changes (CREATE OR REPLACE cannot add OUT columns)
DROP FUNCTION IF EXISTS public.get_conversations_with_meta(uuid);

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
  SELECT
    c.id                          AS conversation_id,
    c.updated_at,
    CASE WHEN c.kind = 'household_teacher' THEN NULL ELSE ou.id END AS other_user_id,
    CASE WHEN c.kind = 'household_teacher' THEN NULL ELSE ou.full_name END AS other_full_name,
    CASE WHEN c.kind = 'household_teacher' THEN NULL ELSE ou.role END AS other_role,
    CASE
      WHEN c.kind = 'household_teacher' THEN NULL
      ELSE COALESCE(
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
      )
    END                           AS other_profile_image_url,
    lm.body                       AS last_message_body,
    lm.created_at                 AS last_message_created_at,
    lm.sender_id                  AS last_message_sender_id,
    (
      SELECT COUNT(*)
      FROM messaging.messages m2
      WHERE m2.conversation_id = c.id
        AND m2.sender_id != p_user_id
        AND m2.read_at IS NULL
    )                             AS unread_count,
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
    END                           AS display_name,
    c.student_id,
    c.teacher_id,
    (
      SELECT COUNT(*)
      FROM messaging.conversation_participants cp3
      WHERE cp3.conversation_id = c.id
    )                             AS participant_count
  FROM messaging.conversation_participants cp
  JOIN messaging.conversations c ON c.id = cp.conversation_id
  LEFT JOIN LATERAL (
    SELECT cp2.user_id
    FROM messaging.conversation_participants cp2
    WHERE cp2.conversation_id = c.id
      AND cp2.user_id != p_user_id
    ORDER BY cp2.user_id
    LIMIT 1
  ) other_part ON c.kind <> 'household_teacher'
  LEFT JOIN admin.users ou ON ou.id = other_part.user_id
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
