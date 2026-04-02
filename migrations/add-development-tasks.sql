-- Create admin.development_tasks table
CREATE TABLE IF NOT EXISTS admin.development_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
  assignee TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin.development_tasks ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "Public can read development tasks"
  ON admin.development_tasks FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access"
  ON admin.development_tasks FOR ALL
  USING (auth.role() = 'service_role');

-- Grant service role access (needed since admin schema grants are per-table)
GRANT USAGE ON SCHEMA admin TO service_role;
GRANT ALL ON admin.development_tasks TO service_role;

-- Seed all tasks in 'not_started' status
INSERT INTO admin.development_tasks (title, status, assignee) VALUES
  ('Tires (line the sand)', 'not_started', NULL),
  ('Raking (rake the sand area in)', 'not_started', NULL),
  ('Wood stumps (put in lines to balance and climb on or in a circle for a meeting area)', 'not_started', NULL),
  ('Canvas shade (attach to trees for extra shade)', 'not_started', NULL),
  ('Chalkboard wall outdoors (above wood platform)', 'not_started', NULL),
  ('Mud kitchen (built by Zelinda; still need to purchase accessories)', 'not_started', 'Zelinda'),
  ('Planters (line them as a "do not cross" area for the kids to separate play area from cars)', 'not_started', NULL),
  ('Slide / climbing wall (put on asphalt pile)', 'not_started', NULL),
  ('Purchase kids shovels, tractors, wheelbarrows (sand toys)', 'not_started', NULL),
  ('Milk cartons for sand toy clean up / organization', 'not_started', NULL),
  ('Hula hoop organization', 'not_started', NULL),
  ('Reading nook (built by Paige''s husband)', 'not_started', 'Paige'),
  ('Picnic tables (built by Simon)', 'not_started', NULL),
  ('Sensory tables (Paige will bring 1 more & Sage field has 2)', 'not_started', 'Paige'),
  ('Create a supply list for students (including rain boots, rain coat, spare clothing)', 'not_started', NULL),
  ('Buckets for play (water, sand, etc)', 'not_started', NULL),
  ('Build chicken coop & chicken run', 'not_started', NULL),
  ('Chicken run accessories (wood trimming & swing & enrichment)', 'not_started', NULL),
  ('Chicken run planters lining it to keep out pond animals (cinder block and pest deterring plants)', 'not_started', NULL),
  ('Misters for patio (potential water misters to keep cool)', 'not_started', NULL),
  ('Painting walls/doors', 'not_started', NULL),
  ('Deep clean floor', 'not_started', NULL),
  ('Finish planters in front of building', 'not_started', NULL),
  ('New swing handle bar for play area', 'not_started', NULL),
  ('Shade for sand area', 'not_started', NULL);
