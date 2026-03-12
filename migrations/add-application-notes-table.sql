CREATE TABLE IF NOT EXISTS parent_app.application_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID     NOT NULL REFERENCES parent_app.applications(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only service role (admin client) can access
ALTER TABLE parent_app.application_notes ENABLE ROW LEVEL SECURITY;
