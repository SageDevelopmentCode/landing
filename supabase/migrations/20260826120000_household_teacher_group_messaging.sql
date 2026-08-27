-- Household group messaging: one thread per student + teacher (parents + grantees + teacher)

ALTER TABLE messaging.conversations
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES admin.students(id),
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES admin.users(id),
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'direct';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_kind_check'
      AND conrelid = 'messaging.conversations'::regclass
  ) THEN
    ALTER TABLE messaging.conversations
      ADD CONSTRAINT conversations_kind_check
      CHECK (kind IN ('direct', 'household_teacher'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_household_teacher_unique
  ON messaging.conversations (student_id, teacher_id)
  WHERE kind = 'household_teacher';

CREATE OR REPLACE FUNCTION public.find_or_create_household_teacher_conversation(
  p_student_id uuid,
  p_teacher_id uuid,
  p_caller_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = messaging, admin, parent_app, teachers, public
AS $$
DECLARE
  conv_id uuid;
  parent_id uuid;
  is_allowed boolean := false;
BEGIN
  SELECT s.parent_id INTO parent_id
  FROM admin.students s
  WHERE s.id = p_student_id
    AND s.is_deleted = false;

  IF parent_id IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  IF p_caller_id = parent_id THEN
    is_allowed := true;
  ELSIF EXISTS (
    SELECT 1
    FROM parent_app.dashboard_access_grants dag
    WHERE dag.owner_id = parent_id
      AND dag.grantee_id = p_caller_id
      AND dag.status = 'active'
  ) THEN
    is_allowed := true;
  ELSIF EXISTS (
    SELECT 1
    FROM teachers.teacher_students ts
    WHERE ts.student_id = p_student_id
      AND ts.teacher_id = p_caller_id
      AND ts.is_deleted = false
  ) THEN
    is_allowed := true;
  END IF;

  IF NOT is_allowed THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT c.id INTO conv_id
  FROM messaging.conversations c
  WHERE c.student_id = p_student_id
    AND c.teacher_id = p_teacher_id
    AND c.kind = 'household_teacher';

  IF conv_id IS NULL THEN
    INSERT INTO messaging.conversations (kind, student_id, teacher_id)
    VALUES ('household_teacher', p_student_id, p_teacher_id)
    RETURNING id INTO conv_id;
  END IF;

  INSERT INTO messaging.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, parent_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO messaging.conversation_participants (conversation_id, user_id)
  SELECT conv_id, dag.grantee_id
  FROM parent_app.dashboard_access_grants dag
  WHERE dag.owner_id = parent_id
    AND dag.status = 'active'
    AND dag.grantee_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO messaging.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, p_teacher_id)
  ON CONFLICT DO NOTHING;

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_or_create_household_teacher_conversation(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_household_teacher_conversation(uuid, uuid, uuid) TO service_role;

-- get_conversations_with_meta: support household group threads
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

GRANT ALL ON FUNCTION public.get_conversations_with_meta(uuid) TO anon, authenticated, service_role;

-- get_conversation_list: support household group threads (mobile)
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

GRANT ALL ON FUNCTION public.get_conversation_list(uuid) TO anon, authenticated, service_role;
