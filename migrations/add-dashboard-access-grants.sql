CREATE TABLE parent_app.dashboard_access_grants (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
  invited_email TEXT        NOT NULL,
  grantee_id    UUID        REFERENCES admin.users(id) ON DELETE SET NULL,
  token         UUID        NOT NULL DEFAULT gen_random_uuid(),
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'active', 'revoked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at   TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  CONSTRAINT uq_owner_email UNIQUE (owner_id, invited_email)
);

CREATE INDEX idx_dag_owner   ON parent_app.dashboard_access_grants (owner_id);
CREATE INDEX idx_dag_grantee ON parent_app.dashboard_access_grants (grantee_id);
CREATE INDEX idx_dag_token   ON parent_app.dashboard_access_grants (token) WHERE status = 'pending';

ALTER TABLE parent_app.dashboard_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON parent_app.dashboard_access_grants
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON parent_app.dashboard_access_grants TO service_role;
