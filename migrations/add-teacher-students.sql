-- Create teachers.teacher_students relationship table
CREATE SCHEMA IF NOT EXISTS teachers;

CREATE TABLE IF NOT EXISTS teachers.teacher_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES admin.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES admin.students(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,
  classroom TEXT,
  is_primary_teacher BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, student_id, school_year)
);

-- Auto-update updated_at on row change
CREATE TRIGGER update_teacher_students_updated_at
  BEFORE UPDATE ON teachers.teacher_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast teacher lookups (e.g. "show me my class")
CREATE INDEX idx_teacher_students_teacher_id ON teachers.teacher_students(teacher_id);

-- Index for fast student lookups (e.g. "who teaches this student")
CREATE INDEX idx_teacher_students_student_id ON teachers.teacher_students(student_id);

-- Soft-delete index (consistent with all other tables)
CREATE INDEX idx_teacher_students_is_deleted ON teachers.teacher_students(is_deleted);

-- Permissions
GRANT USAGE ON SCHEMA teachers TO authenticated, service_role;
GRANT ALL ON teachers.teacher_students TO authenticated;
GRANT ALL ON teachers.teacher_students TO service_role;

-- RLS
ALTER TABLE teachers.teacher_students ENABLE ROW LEVEL SECURITY;

-- Admins can do everything; teachers can read their own rows
CREATE POLICY "Admin full access" ON teachers.teacher_students
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Teachers can view their own students" ON teachers.teacher_students
  FOR SELECT USING (teacher_id = auth.uid());
