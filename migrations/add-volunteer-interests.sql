CREATE TABLE IF NOT EXISTS admin.volunteer_interests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID REFERENCES admin.users(id) ON DELETE SET NULL,
  skills       TEXT NOT NULL,
  help_areas   TEXT[] NOT NULL,
  availability TEXT[] NOT NULL,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'new',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Service role has full access; no anon insert (submissions go through server action with service role key)
ALTER TABLE admin.volunteer_interests ENABLE ROW LEVEL SECURITY;

-- Grant service_role access (required for server action inserts via admin client)
GRANT INSERT ON admin.volunteer_interests TO service_role;
GRANT SELECT ON admin.volunteer_interests TO service_role;
