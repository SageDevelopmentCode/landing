CREATE TABLE admin.parent_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID NOT NULL REFERENCES admin.users(id),
  rating          INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  categories      TEXT[] NOT NULL DEFAULT '{}',
  message         TEXT,
  allow_follow_up BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

GRANT ALL ON admin.parent_feedback TO service_role;
