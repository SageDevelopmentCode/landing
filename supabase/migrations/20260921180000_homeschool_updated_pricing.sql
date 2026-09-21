ALTER TABLE parent_app.applications
  ADD COLUMN IF NOT EXISTS use_updated_homeschool_pricing boolean NOT NULL DEFAULT false;
