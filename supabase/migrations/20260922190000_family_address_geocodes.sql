CREATE TABLE IF NOT EXISTS admin.address_geocodes (
  address_key text PRIMARY KEY,
  formatted_address text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  source text NOT NULL DEFAULT 'nominatim',
  geocoded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin.address_geocodes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE admin.address_geocodes TO service_role;
