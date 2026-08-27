-- Allow any staff teacher to start household group threads from compose.
-- Restrict find_or_create_conversation to direct 2-person threads only.

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
  ELSIF EXISTS (
    SELECT 1
    FROM admin.users u
    WHERE u.id = p_caller_id
      AND u.role IN ('teacher', 'super_admin', 'teacher_aide')
      AND u.is_deleted = false
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

CREATE OR REPLACE FUNCTION public.find_or_create_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = messaging, admin, public
AS $$
DECLARE
  conv_id uuid;
  my_id uuid := auth.uid();
BEGIN
  SELECT cp1.conversation_id INTO conv_id
  FROM messaging.conversation_participants cp1
  JOIN messaging.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  JOIN messaging.conversations c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = my_id
    AND cp2.user_id = other_user_id
    AND c.kind = 'direct'
    AND (
      SELECT COUNT(*)
      FROM messaging.conversation_participants cp3
      WHERE cp3.conversation_id = c.id
    ) = 2
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  INSERT INTO messaging.conversations (kind)
  VALUES ('direct')
  RETURNING id INTO conv_id;

  INSERT INTO messaging.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, my_id), (conv_id, other_user_id);

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_or_create_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_conversation(uuid) TO service_role;
