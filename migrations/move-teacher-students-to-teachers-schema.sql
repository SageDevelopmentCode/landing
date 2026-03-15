-- Move teacher_students from admin schema to dedicated teachers schema

-- 1. Create the teachers schema
CREATE SCHEMA IF NOT EXISTS teachers;

-- 2. Move the table (indexes, constraints, and trigger move with it)
ALTER TABLE admin.teacher_students SET SCHEMA teachers;

-- 3. Re-create the trigger with explicit schema qualification to avoid search_path ambiguity
DROP TRIGGER IF EXISTS update_teacher_students_updated_at ON teachers.teacher_students;
CREATE TRIGGER update_teacher_students_updated_at
  BEFORE UPDATE ON teachers.teacher_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Grant permissions
GRANT USAGE ON SCHEMA teachers TO authenticated, service_role;
GRANT ALL ON teachers.teacher_students TO authenticated;
GRANT ALL ON teachers.teacher_students TO service_role;
