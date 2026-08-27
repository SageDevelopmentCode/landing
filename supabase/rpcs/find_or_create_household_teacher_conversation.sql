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
