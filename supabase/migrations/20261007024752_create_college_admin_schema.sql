/*
# Create college administration schema

## New Tables
1. courses
   - id (uuid, PK)
   - course_id (text, unique) — human-readable course code like "BCA"
   - name (text) — full course name
   - department (text) — department name
   - duration_years (int) — duration in years
   - num_semesters (int) — total number of semesters
   - created_at (timestamptz)

2. subjects
   - id (uuid, PK)
   - subject_code (text, unique) — e.g. "BCA101"
   - subject_name (text)
   - course_id (uuid, FK → courses.id)
   - semester (int) — which semester (1..num_semesters)
   - credits (int) — credit hours
   - faculty (text) — faculty member name
   - created_at (timestamptz)

3. students
   - id (uuid, PK)
   - student_id (text, unique) — e.g. "STU001"
   - enrollment_number (text, unique)
   - name (text)
   - email (text)
   - phone (text)
   - date_of_birth (date)
   - gender (text) — 'male' | 'female' | 'other'
   - address (text)
   - course_id (uuid, FK → courses.id)
   - semester (int)
   - section (text)
   - photo_url (text, nullable)
   - created_at (timestamptz)

4. attendance
   - id (uuid, PK)
   - student_id (uuid, FK → students.id ON DELETE CASCADE)
   - subject_id (uuid, FK → subjects.id)
   - date (date) — the class date
   - status (text) — 'present' | 'absent' | 'late'
   - created_at (timestamptz)

5. marks
   - id (uuid, PK)
   - student_id (uuid, FK → students.id ON DELETE CASCADE)
   - subject_id (uuid, FK → subjects.id)
   - internal_marks (numeric) — out of 100
   - assignment_marks (numeric) — out of 100
   - exam_marks (numeric) — out of 100
   - created_at (timestamptz)

6. assignments
   - id (uuid, PK)
   - student_id (uuid, FK → students.id ON DELETE CASCADE)
   - subject_id (uuid, FK → subjects.id)
   - title (text) — assignment title
   - deadline (date)
   - status (text) — 'pending' | 'submitted' | 'graded'
   - marks (numeric, nullable) — awarded marks if graded
   - created_at (timestamptz)

## Security
- RLS enabled on all tables.
- Anon + authenticated full CRUD (single-tenant, no auth screen).
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE).

## Notes
- Existing tasks table is untouched.
*/

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text UNIQUE NOT NULL,
  name text NOT NULL,
  department text NOT NULL,
  duration_years int NOT NULL DEFAULT 3,
  num_semesters int NOT NULL DEFAULT 6,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text UNIQUE NOT NULL,
  subject_name text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  semester int NOT NULL,
  credits int NOT NULL DEFAULT 4,
  faculty text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
CREATE POLICY "anon_select_subjects" ON subjects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
CREATE POLICY "anon_insert_subjects" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
CREATE POLICY "anon_update_subjects" ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
CREATE POLICY "anon_delete_subjects" ON subjects FOR DELETE TO anon, authenticated USING (true);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  enrollment_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  date_of_birth date,
  gender text,
  address text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  semester int NOT NULL DEFAULT 1,
  section text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- Marks
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  internal_marks numeric NOT NULL DEFAULT 0,
  assignment_marks numeric NOT NULL DEFAULT 0,
  exam_marks numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_marks" ON marks;
CREATE POLICY "anon_select_marks" ON marks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_marks" ON marks;
CREATE POLICY "anon_insert_marks" ON marks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_marks" ON marks;
CREATE POLICY "anon_update_marks" ON marks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_marks" ON marks;
CREATE POLICY "anon_delete_marks" ON marks FOR DELETE TO anon, authenticated USING (true);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  deadline date,
  status text NOT NULL DEFAULT 'pending',
  marks numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_assignments" ON assignments;
CREATE POLICY "anon_select_assignments" ON assignments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assignments" ON assignments;
CREATE POLICY "anon_insert_assignments" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assignments" ON assignments;
CREATE POLICY "anon_update_assignments" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assignments" ON assignments;
CREATE POLICY "anon_delete_assignments" ON assignments FOR DELETE TO anon, authenticated USING (true);
