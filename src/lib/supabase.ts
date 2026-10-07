import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  completed: boolean;
  created_at: string;
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'completed'> & {
  completed?: boolean;
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; dot: string; badge: string; text: string }
> = {
  high: {
    label: 'High',
    dot: 'bg-red-500',
    badge: 'bg-red-50 border-red-200 text-red-700',
    text: 'text-red-600',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    text: 'text-amber-600',
  },
  low: {
    label: 'Low',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'text-emerald-600',
  },
};

export interface Course {
  id: string;
  course_id: string;
  name: string;
  department: string;
  duration_years: number;
  num_semesters: number;
  created_at: string;
}

export type CourseInsert = Omit<Course, 'id' | 'created_at'>;

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  course_id: string;
  semester: number;
  credits: number;
  faculty: string;
  created_at: string;
}

export type SubjectInsert = Omit<Subject, 'id' | 'created_at'>;

export interface Student {
  id: string;
  student_id: string;
  enrollment_number: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  course_id: string | null;
  semester: number;
  section: string | null;
  photo_url: string | null;
  created_at: string;
}

export type StudentInsert = Omit<Student, 'id' | 'created_at'>;

export interface Attendance {
  id: string;
  student_id: string;
  subject_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  internal_marks: number;
  assignment_marks: number;
  exam_marks: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  deadline: string | null;
  status: 'pending' | 'submitted' | 'graded';
  marks: number | null;
  created_at: string;
}

export function computeGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-600' };
  if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' };
  if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600' };
  if (percentage >= 60) return { grade: 'B', color: 'text-blue-600' };
  if (percentage >= 50) return { grade: 'C', color: 'text-amber-600' };
  if (percentage >= 40) return { grade: 'D', color: 'text-orange-600' };
  return { grade: 'F', color: 'text-red-600' };
}
