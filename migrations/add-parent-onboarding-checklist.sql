CREATE TABLE IF NOT EXISTS parent_app.onboarding_checklist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID        NOT NULL UNIQUE,
  completed   TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_parent
    FOREIGN KEY (parent_id) REFERENCES admin.users(id) ON DELETE CASCADE
);

ALTER TABLE parent_app.onboarding_checklist ENABLE ROW LEVEL SECURITY;
GRANT ALL ON parent_app.onboarding_checklist TO service_role;
