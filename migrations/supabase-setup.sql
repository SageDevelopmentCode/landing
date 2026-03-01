-- ============================================
-- SAGEFIELD SCHOOL - DATABASE SETUP
-- ============================================
-- Copy and paste this into Supabase SQL Editor
-- This will create the waitlist schema and table

-- ============================================
-- 1. CREATE SCHEMAS
-- ============================================
-- Separate logical schemas for different parts of the application
CREATE SCHEMA IF NOT EXISTS waitlist;
CREATE SCHEMA IF NOT EXISTS admin;
CREATE SCHEMA IF NOT EXISTS parent_app;

-- ============================================
-- 2. CREATE WAITLIST SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS waitlist.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_age INTEGER NOT NULL CHECK (child_age >= 1 AND child_age <= 18),
  special_interests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'enrolled', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
-- Index for looking up submissions by email
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_email
  ON waitlist.submissions(email);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_status
  ON waitlist.submissions(status);

-- Index for sorting by creation date (most recent first)
CREATE INDEX IF NOT EXISTS idx_waitlist_submissions_created_at
  ON waitlist.submissions(created_at DESC);

-- ============================================
-- 4. CREATE TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- ============================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION waitlist.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that calls the function before any update
CREATE TRIGGER update_waitlist_submissions_updated_at
  BEFORE UPDATE ON waitlist.submissions
  FOR EACH ROW
  EXECUTE FUNCTION waitlist.update_updated_at_column();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE waitlist.submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Policy: Allow anyone (anonymous users) to INSERT into waitlist
-- This allows the public form to submit data
CREATE POLICY "Allow public insert to waitlist"
  ON waitlist.submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Prevent anonymous users from reading waitlist data
-- Only authenticated admin users will be able to read (setup later)
CREATE POLICY "Prevent public read of waitlist"
  ON waitlist.submissions
  FOR SELECT
  TO anon
  USING (false);

-- Note: Admin policies will be added later when we set up authentication
-- For now, you can query as the service role in your backend

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================
-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA waitlist TO anon, authenticated;

-- Grant insert permission to anonymous users (for form submissions)
GRANT INSERT ON waitlist.submissions TO anon;

-- Grant all permissions to authenticated users (for future admin portal)
GRANT ALL ON waitlist.submissions TO authenticated;

-- ============================================
-- 8. VERIFICATION QUERIES (Optional - for testing)
-- ============================================
-- Run these after setup to verify everything works:

-- Check that the table was created
-- SELECT * FROM waitlist.submissions LIMIT 1;

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'submissions';

-- Test insert (simulate form submission)
-- INSERT INTO waitlist.submissions (email, child_name, child_age, special_interests)
-- VALUES ('test@example.com', 'Test Child', 7, 'Loves nature and science');

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Run: npx supabase gen types typescript --project-id vonuwpzepwrbdlectspd > app/types/database.types.ts
-- 2. This will generate TypeScript types for your database
