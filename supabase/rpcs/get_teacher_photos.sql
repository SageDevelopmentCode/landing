CREATE OR REPLACE FUNCTION public.get_teacher_photos(p_teacher_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
  FROM (
    SELECT
      p.id,
      p.teacher_id,
      p.storage_path,
      p.caption,
      p.taken_on,
      p.created_at,
      p.publication_labels,
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'student_id',        s.id,
            'name',              s.child_legal_name,
            'profile_image_url', s.profile_image_url,
            'consent_level',     c.consent_level
          ))
          FROM teachers.photo_student_tags t2
          JOIN admin.students s ON s.id = t2.student_id
          LEFT JOIN parent_app.student_photo_release_consent c ON c.student_id = s.id
          WHERE t2.photo_id = p.id
        ),
        '[]'::json
      ) AS tags
    FROM teachers.photos p
    WHERE p.teacher_id = p_teacher_id
      AND p.is_deleted = false
  ) t
$$;
