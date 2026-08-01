-- Run this in the Supabase SQL editor (or a migration).
-- Returns all above-the-fold home screen data in one round trip.

CREATE OR REPLACE FUNCTION public.rpc_home_screen_data(
  p_user_id   uuid,
  p_parent_id uuid
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'profile', (
      SELECT json_build_object('full_name', full_name, 'profile_image_url', profile_image_url)
      FROM admin.users
      WHERE id = p_user_id
    ),
    'students', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT id, child_legal_name, child_grade, profile_image_url
        FROM admin.students
        WHERE parent_id = p_parent_id
          AND is_deleted = false
      ) s
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM (
        SELECT id, title, event_date, is_all_day, start_time, end_time,
               color, category, description, location, attachment_links
        FROM calendar.events
        WHERE event_date >= current_date
        ORDER BY event_date ASC
        LIMIT 3
      ) e
    ),
    'pending_payments', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
      FROM (
        SELECT id, label, amount_cents, program, student_id
        FROM billing.pending_payment_requests
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT 3
      ) p
    ),
    'onboarding', (
      SELECT row_to_json(o)
      FROM (
        SELECT completed
        FROM parent_app.onboarding_checklist
        WHERE parent_id = p_parent_id
        LIMIT 1
      ) o
    ),
    'dropoff', (
      SELECT row_to_json(d)
      FROM (
        SELECT slot
        FROM parent_app.dropoff_times
        WHERE parent_id = p_parent_id
        LIMIT 1
      ) d
    ),
    'applications', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT id, student_id, status, program, drop_in_program, child_legal_name
        FROM parent_app.applications
        WHERE user_id = p_parent_id
          AND approved = true
          AND program IN ('summer_26', 'both', 'homeschool_drop_in', 'school_year_26_27')
      ) a
    ),
    'transactions', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT student_id, payment_type, status, metadata
        FROM billing.stripe_transactions
        WHERE parent_id = p_parent_id
          AND is_deleted = false
          AND status = 'completed'
      ) t
    )
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_home_screen_data(uuid, uuid) TO authenticated;
