import { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, Eye, UserCircle2 } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  SearchInput,
  Select,
  LoadingOverlay,
  EmptyState,
  ErrorBanner,
  PageHeader,
} from '@/components/ui';
import { supabase, type Student, type Course } from '@/lib/supabase';

interface StudentsPageProps {
  onViewStudent: (id: string) => void;
}

export default function StudentsPage({ onViewStudent }: StudentsPageProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: studentData, error: sErr }, { data: courseData, error: cErr }] =
      await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('courses').select('*').order('name'),
      ]);

    if (sErr || cErr) {
      setError('Could not load student data. Please try again.');
      setLoading(false);
      return;
    }
    setStudents(studentData as Student[]);
    setCourses(courseData as Course[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (courseFilter !== 'all' && s.course_id !== courseFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.enrollment_number.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, search, courseFilter]);

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} students enrolled`}
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, ID, or email..."
            className="flex-1"
          />
          <Select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="sm:w-56"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_id} - {c.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingOverlay />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No students found"
            description={
              search || courseFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Students will appear here once added.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((student) => {
            const course = student.course_id
              ? courseMap.get(student.course_id)
              : null;
            return (
              <Card
                key={student.id}
                className="group p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <UserCircle2 className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-800">
                      {student.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {student.student_id}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {course && <Badge color="blue">{course.course_id}</Badge>}
                      <Badge color="slate">Sem {student.semester}</Badge>
                      {student.section && (
                        <Badge color="purple">Sec {student.section}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onViewStudent(student.id)}
                  >
                    <Eye className="h-4 w-4" />
                    View Profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
