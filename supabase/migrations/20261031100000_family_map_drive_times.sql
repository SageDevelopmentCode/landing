CREATE TABLE IF NOT EXISTS admin.family_map_drive_times (
  address_key text NOT NULL,
  campus_id text NOT NULL CHECK (campus_id IN ('gattis', 'hutto')),
  duration_seconds integer NOT NULL,
  source text NOT NULL DEFAULT 'osrm',
  routed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (address_key, campus_id)
);

ALTER TABLE admin.family_map_drive_times ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE admin.family_map_drive_times TO service_role;
