-- ============================================
-- PARENT_APP — School day food preferences (per child)
-- ============================================

CREATE TABLE IF NOT EXISTS parent_app.student_school_day_food_preferences (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id                   UUID        NOT NULL REFERENCES admin.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  student_id                  UUID        NOT NULL REFERENCES admin.students(id) ON UPDATE CASCADE ON DELETE CASCADE,
  emergency_snack_preference  TEXT        NOT NULL
                                          CHECK (emergency_snack_preference IN (
                                            'always_allow',
                                            'ask_permission',
                                            'approved_only'
                                          )),
  shared_food_preference      TEXT        NOT NULL
                                          CHECK (shared_food_preference IN (
                                            'always_allow',
                                            'ask_each_time',
                                            'do_not_offer'
                                          )),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_school_day_food_prefs_parent_id
  ON parent_app.student_school_day_food_preferences (parent_id);

CREATE INDEX IF NOT EXISTS idx_student_school_day_food_prefs_student_id
  ON parent_app.student_school_day_food_preferences (student_id);

CREATE TRIGGER trg_student_school_day_food_prefs_updated_at
  BEFORE UPDATE ON parent_app.student_school_day_food_preferences
  FOR EACH ROW EXECUTE FUNCTION parent_app.set_updated_at();

ALTER TABLE parent_app.student_school_day_food_preferences ENABLE ROW LEVEL SECURITY;

-- Parent CRUD
CREATE POLICY "parent can read own school day food prefs"
  ON parent_app.student_school_day_food_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "parent can insert own school day food prefs"
  ON parent_app.student_school_day_food_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "parent can update own school day food prefs"
  ON parent_app.student_school_day_food_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "parent can delete own school day food prefs"
  ON parent_app.student_school_day_food_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id);

-- Grantee access (shared dashboard)
CREATE POLICY "Active grantee can access owner school day food prefs"
  ON parent_app.student_school_day_food_preferences
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_app.dashboard_access_grants
      WHERE dashboard_access_grants.owner_id = student_school_day_food_preferences.parent_id
        AND dashboard_access_grants.grantee_id = auth.uid()
        AND dashboard_access_grants.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_app.dashboard_access_grants
      WHERE dashboard_access_grants.owner_id = student_school_day_food_preferences.parent_id
        AND dashboard_access_grants.grantee_id = auth.uid()
        AND dashboard_access_grants.status = 'active'
    )
  );

-- Staff read
CREATE POLICY "Staff can view all school day food prefs"
  ON parent_app.student_school_day_food_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin.users
      WHERE users.id = auth.uid()
        AND users.role = ANY (ARRAY['teacher'::text, 'super_admin'::text])
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON parent_app.student_school_day_food_preferences TO authenticated;
GRANT ALL ON parent_app.student_school_day_food_preferences TO service_role;
