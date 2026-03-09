CREATE SCHEMA IF NOT EXISTS email_logs;

CREATE TABLE email_logs.sends (
id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
application_id UUID REFERENCES parent_app.applications(id) ON DELETE SET NULL,
to_address     TEXT NOT NULL,
subject        TEXT NOT NULL,
status         TEXT NOT NULL CHECK (status IN ('success', 'error')),
error_message  TEXT,
sent_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow service role full access
GRANT USAGE ON SCHEMA email_logs TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA email_logs TO service_role;
