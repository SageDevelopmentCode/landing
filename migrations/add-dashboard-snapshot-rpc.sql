CREATE OR REPLACE FUNCTION get_dashboard_snapshot()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_sessions json;
  v_enrollment      json;
  v_financials      json;
  v_upcoming_tours  json;
  v_month_start     date := date_trunc('month', now())::date;
  v_month_end       date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
  v_today           date := now()::date;
BEGIN
  -- 1. Employees currently clocked in (clock_out_at IS NULL, today)
  SELECT json_agg(row_to_json(t)) INTO v_active_sessions
  FROM (
    SELECT cs.id, cs.clock_in_at, u.full_name, u.profile_image_url
    FROM teachers.clock_sessions cs
    JOIN admin.users u ON u.id = cs.teacher_id
    WHERE cs.clock_out_at IS NULL
      AND cs.clock_in_at::date = v_today
    ORDER BY cs.clock_in_at ASC
  ) t;

  -- 2. Enrolled kids per program, excluding "Don't Include" tagged applications
  SELECT json_agg(row_to_json(t)) INTO v_enrollment
  FROM (
    SELECT program, count(*)::int AS count
    FROM parent_app.applications
    WHERE status = 'enrolled'
      AND is_active = true
      AND NOT (admin_tags @> ARRAY['Don''t Include'::text])
    GROUP BY program
    ORDER BY program
  ) t;

  -- 3. Revenue & expenses for the current month
  SELECT json_build_object(
    'revenue', coalesce(
      (SELECT sum(
         CASE WHEN cover_fees
           THEN coalesce(intended_amount_cents, amount_cents)
           ELSE amount_cents
         END
       )::numeric / 100
       FROM billing.stripe_transactions
       WHERE exclude_from_revenue = false
         AND is_deleted = false
         AND created_at::date >= v_month_start
         AND created_at::date <= v_month_end
      ), 0),
    'expenses', coalesce(
      (SELECT sum(amount)
       FROM budget.expenses
       WHERE is_deleted = false
         AND category <> 'Savings'
         AND expense_date::date >= v_month_start
         AND expense_date::date <= v_month_end
      ), 0)
  ) INTO v_financials;

  -- 4. Upcoming tour bookings (today onwards, not cancelled/completed/no_show), max 5
  SELECT json_agg(row_to_json(t)) INTO v_upcoming_tours
  FROM (
    SELECT id, first_name, last_name, tour_date, tour_time, status, num_children
    FROM marketing.tour_bookings
    WHERE is_deleted = false
      AND tour_date::date >= v_today
      AND status NOT IN ('cancelled', 'completed', 'no_show')
    ORDER BY tour_date ASC, tour_time ASC
    LIMIT 5
  ) t;

  RETURN json_build_object(
    'active_sessions', coalesce(v_active_sessions, '[]'::json),
    'enrollment',      coalesce(v_enrollment, '[]'::json),
    'financials',      coalesce(v_financials, json_build_object('revenue', 0, 'expenses', 0)),
    'upcoming_tours',  coalesce(v_upcoming_tours, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_snapshot() TO service_role;
