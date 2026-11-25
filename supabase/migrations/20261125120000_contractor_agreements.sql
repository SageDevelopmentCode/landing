-- ============================================
-- TEACHERS SCHEMA — Independent contractor agreements
-- ============================================
-- Admin creates one row per teacher with the school's terms pre-filled and
-- shares a private link (/agreement/<token>). The teacher signs without
-- logging in; admin countersigns. All reads/writes go through server actions
-- using the service-role client, so only service_role has grants.

CREATE TABLE IF NOT EXISTS teachers.contractor_agreements (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token                    TEXT        NOT NULL UNIQUE,
  template_version         TEXT        NOT NULL DEFAULT 'educator-v1',
  status                   TEXT        NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'countersigned', 'voided')),

  -- School terms (admin)
  contractor_name          TEXT        NOT NULL,
  contractor_email         TEXT,
  role                     TEXT        NOT NULL
    CHECK (role IN ('lead_teacher', 'teacher_aide', 'one_to_one_aide', 'substitute', 'other')),
  role_other               TEXT,
  effective_date           DATE,
  start_date               DATE,
  end_date_text            TEXT,
  rate_amount              NUMERIC(10, 2),
  rate_unit                TEXT CHECK (rate_unit IS NULL OR rate_unit IN ('hour', 'day', 'week', 'month')),
  invoice_due_text         TEXT,
  invoice_period           TEXT CHECK (invoice_period IS NULL OR invoice_period IN ('week', 'month')),
  payment_days             INTEGER,
  absence_notice_hours     INTEGER,
  time_off_notice_days     INTEGER,
  termination_notice_days  INTEGER,
  second_contact           TEXT,
  exhibit_a                JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- Contractor (teacher) submission
  contractor_address       TEXT,
  contractor_phone         TEXT,
  signer_email             TEXT,
  section_signatures       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  signed_printed_name      TEXT,
  signed_signature         TEXT,
  signed_at                TIMESTAMPTZ,
  signer_ip                TEXT,
  signer_user_agent        TEXT,
  esign_consent_at         TIMESTAMPTZ,

  -- School countersignature
  school_signer_name       TEXT,
  school_signer_title      TEXT,
  school_signature         TEXT,
  countersigned_at         TIMESTAMPTZ,
  countersigned_by         UUID        REFERENCES admin.users (id) ON DELETE SET NULL,

  viewed_at                TIMESTAMPTZ,
  voided_at                TIMESTAMPTZ,
  created_by               UUID        REFERENCES admin.users (id) ON DELETE SET NULL,
  is_deleted               BOOLEAN     NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractor_agreements_status
  ON teachers.contractor_agreements (status)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_contractor_agreements_created_at
  ON teachers.contractor_agreements (created_at DESC);

CREATE TRIGGER set_contractor_agreements_updated_at
  BEFORE UPDATE ON teachers.contractor_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE teachers.contractor_agreements ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: access is service-role only via server actions.
GRANT ALL ON teachers.contractor_agreements TO service_role;
