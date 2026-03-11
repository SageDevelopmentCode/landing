-- Migration: Create student_health_info table
-- Stores emergency contact, physician/medical info, and health conditions
-- filled out by parents as part of the enrollment health form (CONTRACT_3).

CREATE TABLE parent_app.student_health_info (
  id                               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id                        UUID NOT NULL,
  student_id                       UUID NOT NULL,

  -- Authorized Emergency Contacts
  in_state_contact_name            TEXT,
  in_state_contact_relation        TEXT,
  in_state_contact_phone           TEXT,
  out_of_state_contact_name        TEXT,
  out_of_state_contact_relation    TEXT,
  out_of_state_contact_phone       TEXT,

  -- Physician and Medical Information
  physician_name                   TEXT,
  clinic_name                      TEXT,
  physician_phone                  TEXT,
  insurance_provider               TEXT,
  policy_number                    TEXT,
  group_number                     TEXT,
  preferred_hospital               TEXT,

  -- Health Conditions (supplements application data)
  health_conditions                TEXT,
  ongoing_care                     BOOLEAN DEFAULT FALSE,
  ongoing_care_description         TEXT,
  emergency_medication_required    BOOLEAN DEFAULT FALSE,
  emergency_medication_description TEXT,

  -- Immunization
  immunization_status              TEXT CHECK (immunization_status IN ('record', 'exemption')),

  created_at                       TIMESTAMPTZ DEFAULT NOW(),
  updated_at                       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (parent_id, student_id),
  FOREIGN KEY (parent_id) REFERENCES admin.users(id),
  FOREIGN KEY (student_id) REFERENCES admin.students(id)
);

-- Grant service role access (same pattern as enrollment_signatures)
GRANT ALL ON parent_app.student_health_info TO service_role;
