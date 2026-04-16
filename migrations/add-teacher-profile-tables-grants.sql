-- Grant permissions for teacher profile tables created from the mobile app.
-- These tables already exist in the teachers schema but were never granted
-- access to the web app's authenticated/service_role roles.

GRANT USAGE ON SCHEMA teachers TO authenticated, service_role;

GRANT ALL ON teachers.teacher_profiles TO authenticated;
GRANT ALL ON teachers.teacher_profiles TO service_role;

GRANT ALL ON teachers.teacher_qualifications TO authenticated;
GRANT ALL ON teachers.teacher_qualifications TO service_role;

GRANT ALL ON teachers.teacher_experience TO authenticated;
GRANT ALL ON teachers.teacher_experience TO service_role;
