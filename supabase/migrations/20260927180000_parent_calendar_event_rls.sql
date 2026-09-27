-- Allow enrolled parents to create parent-audience calendar events and manage their own.

CREATE OR REPLACE FUNCTION calendar.is_enrolled_parent(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = calendar, parent_app, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_app.applications a
    WHERE a.user_id = uid
      AND a.status = 'enrolled'
  )
  OR EXISTS (
    SELECT 1
    FROM parent_app.dashboard_access_grants g
    JOIN parent_app.applications a ON a.user_id = g.owner_id AND a.status = 'enrolled'
    WHERE g.grantee_id = uid
      AND g.status = 'active'
  );
$$;

ALTER FUNCTION calendar.is_enrolled_parent(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION calendar.is_enrolled_parent(uuid) TO authenticated;

CREATE POLICY parent_insert_calendar_events
  ON calendar.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    calendar.is_enrolled_parent(auth.uid())
    AND created_by = auth.uid()
    AND shared_with = ARRAY['Parents']::text[]
  );

CREATE POLICY parent_update_own_calendar_events
  ON calendar.events
  FOR UPDATE
  TO authenticated
  USING (
    calendar.is_enrolled_parent(auth.uid())
    AND created_by = auth.uid()
  )
  WITH CHECK (
    shared_with = ARRAY['Parents']::text[]
    AND created_by = auth.uid()
  );

CREATE POLICY parent_delete_own_calendar_events
  ON calendar.events
  FOR DELETE
  TO authenticated
  USING (
    calendar.is_enrolled_parent(auth.uid())
    AND created_by = auth.uid()
  );
