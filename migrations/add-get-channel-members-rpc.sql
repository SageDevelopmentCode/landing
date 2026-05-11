CREATE OR REPLACE FUNCTION public.get_channel_members(p_channel_id UUID)
RETURNS JSON
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
            'child_legal_name',  s.child_legal_name,
            'profile_image_url', s.profile_image_url
          ) ORDER BY s.child_legal_name)
          FROM admin.students s
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

GRANT EXECUTE ON FUNCTION public.get_channel_members(UUID) TO service_role;
