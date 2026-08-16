CREATE OR REPLACE FUNCTION public.get_channel_members(p_channel_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT
      u.id,
      u.full_name,
      u.profile_image_url,
      u.role,
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'id',                s.id,
            'child_legal_name',  COALESCE(
              NULLIF(TRIM(a.preferred_name), ''),
              s.child_legal_name
            ),
            'profile_image_url', s.profile_image_url
          ) ORDER BY s.child_legal_name)
          FROM admin.students s
          LEFT JOIN LATERAL (
            SELECT preferred_name
            FROM parent_app.applications
            WHERE student_id = s.id
              AND status = 'enrolled'
            ORDER BY updated_at DESC NULLS LAST
            LIMIT 1
          ) a ON true
          WHERE s.parent_id = u.id
            AND s.is_deleted = false
        ),
        '[]'::json
      ) AS children
    FROM messaging.channel_members cm
    JOIN admin.users u ON u.id = cm.user_id
    WHERE cm.channel_id = p_channel_id
      AND u.is_deleted = false
      AND u.id != '893f483e-2724-428f-a2f9-4333831501c7'
    ORDER BY u.full_name
  ) t
$$;
