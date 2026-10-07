import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BookOpen,
  GraduationCap,
  Pencil,
  UserCircle2,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  Select,
  TextArea,
  LoadingOverlay,
  ErrorBanner,
  EmptyState,
  Table,
  TableRow,
  TableCell,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  supabase,
  type Student,
  type Course,
  type Subject,
  type Attendance,
  type Mark,
  type Assignment,
  computeGrade,
} from '@/lib/supabase';

interface StudentProfilePageProps {
  studentId: string;
  onBack: () => void;
}

type Tab = 'overview' | 'attendance' | 'marks' | 'subjects' | 'assignments';

const TABS: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'marks', label: 'Marks', icon: Award },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'assignments', label: 'Assignments', icon: FileText },
];

export default function StudentProfilePage({
  studentId,
  onBack,
}: StudentProfilePageProps) {
  const { showToast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: studentData, error: sErr } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (sErr || !studentData) {
      setError('Could not load student profile.');
      setLoading(false);
      return;
    }
    const stu = studentData as Student;
    setStudent(stu);

    const courseIds = stu.course_id ? [stu.course_id] : [];
    const [
      { data: courseData },
      { data: subjData },
      { data: attData },
      { data: marksData },
      { data: assignData },
      { data: allCourseData },
    ] = await Promise.all([
      courseIds.length
        ? supabase.from('courses').select('*').eq('id', stu.course_id!).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('subjects').select('*').eq('course_id', stu.course_id ?? '').order('semester'),
      supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      supabase.from('marks').select('*').eq('student_id', studentId),
      supabase.from('assignments').select('*').eq('student_id', studentId).order('deadline', { ascending: false }),
      supabase.from('courses').select('*').order('name'),
    ]);

    setCourse(courseData as Course | null);
    setSubjects((subjData as Subject[]) || []);
    setAttendance((attData as Attendance[]) || []);
    setMarks((marksData as Mark[]) || []);
    setAssignments((assignData as Assignment[]) || []);
    setAllCourses((allCourseData as Course[]) || []);
    setError(null);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Compute academic summary
  const academicSummary = useMemo(() => {
    if (marks.length === 0)
      return { overallPercentage: 0, grade: { grade: '-', color: 'text-slate-400' }, totalMarks: 0 };

    let totalInternal = 0;
    let totalAssignment = 0;
    let totalExam = 0;
    marks.forEach((m) => {
      totalInternal += m.internal_marks;
      totalAssignment += m.assignment_marks;
      totalExam += m.exam_marks;
    });
    const avgInternal = totalInternal / marks.length;
    const avgAssignment = totalAssignment / marks.length;
    const avgExam = totalExam / marks.length;
    const overall = (avgInternal + avgAssignment + avgExam) / 3;
    const overallPercentage = Math.round(overall * 100) / 100;
    return {
      overallPercentage,
      grade: computeGrade(overallPercentage),
      totalMarks: marks.length,
      avgInternal: Math.round(avgInternal * 100) / 100,
      avgAssignment: Math.round(avgAssignment * 100) / 100,
      avgExam: Math.round(avgExam * 100) / 100,
    };
  }, [marks]);

  // Compute attendance summary
  const attendanceSummary = useMemo(() => {
    if (attendance.length === 0) return { percentage: 0, present: 0, absent: 0, late: 0 };
    const present = attendance.filter((a) => a.status === 'present').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const percentage = Math.round(((present + late * 0.5) / attendance.length) * 100);
    return { percentage, present, absent, late };
  }, [attendance]);

  const handleSaveEdit = async (updated: Partial<Student>) => {
    if (!student) return;
    setEditSaving(true);
    const { error } = await supabase.from('students').update(updated).eq('id', student.id);
    if (error) {
      showToast('Failed to update profile.', 'error');
      setEditSaving(false);
      return;
    }
    showToast('Profile updated successfully.');
    setEditOpen(false);
    setEditSaving(false);
    fetchData();
  };

  if (loading) return <LoadingOverlay />;
  if (error)
    return (
      <div>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Button>
      </div>
    );
  if (!student) return null;

  const InfoField = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof Mail;
    label: string;
    value: string | null | undefined;
  }) => (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-700">
          {value || '—'}
        </p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Profile header card */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 shadow-md">
                  <UserCircle2 className="h-12 w-12 text-slate-400" />
                </div>
              )}
              <div className="pb-1">
                <h1 className="text-xl font-bold text-slate-800">{student.name}</h1>
                <p className="mt-0.5 text-sm text-slate-400">
                  {student.student_id} · {student.enrollment_number}
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Student info */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-slate-500">
              Student Information
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <InfoField icon={User} label="Student ID" value={student.student_id} />
              <InfoField
                icon={GraduationCap}
                label="Enrollment Number"
                value={student.enrollment_number}
              />
              <InfoField icon={Mail} label="Email" value={student.email} />
              <InfoField icon={Phone} label="Phone" value={student.phone} />
              <InfoField
                icon={Calendar}
                label="Date of Birth"
                value={
                  student.date_of_birth
                    ? new Date(student.date_of_birth + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )
                    : null
                }
              />
              <InfoField
                icon={User}
                label="Gender"
                value={
                  student.gender
                    ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                    : null
                }
              />
              <InfoField icon={MapPin} label="Address" value={student.address} />
              <InfoField
                icon={BookOpen}
                label="Course"
                value={course ? `${course.course_id} - ${course.name}` : null}
              />
              <InfoField
                icon={GraduationCap}
                label="Semester"
                value={`Semester ${student.semester}`}
              />
              <InfoField
                icon={User}
                label="Section"
                value={student.section ? `Section ${student.section}` : null}
              />
            </div>
          </Card>

          {/* Academic summary */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                Academic Summary
              </h3>
              <div className="flex flex-col items-center py-3">
                <p className={`text-5xl font-extrabold ${academicSummary.grade.color}`}>
                  {academicSummary.grade.grade}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-400">Overall Grade</p>
                <p className="mt-3 text-2xl font-bold text-slate-800">
                  {academicSummary.overallPercentage}%
                </p>
                <p className="text-xs text-slate-400">Overall Percentage</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                Attendance Summary
              </h3>
              <div className="flex flex-col items-center py-2">
                <p
                  className={`text-4xl font-extrabold ${
                    attendanceSummary.percentage >= 75
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {attendanceSummary.percentage}%
                </p>
                <p className="mt-1 text-sm font-medium text-slate-400">Attendance Rate</p>
                <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-emerald-600">
                      {attendanceSummary.present}
                    </p>
                    <p className="text-xs text-slate-400">Present</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">
                      {attendanceSummary.late}
                    </p>
                    <p className="text-xs text-slate-400">Late</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">
                      {attendanceSummary.absent}
                    </p>
                    <p className="text-xs text-slate-400">Absent</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card className="p-6">
          {attendance.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-8 w-8" />}
              title="No attendance records"
              description="Attendance data will appear here once recorded."
            />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-4">
                <Badge color="green">
                  Present: {attendanceSummary.present}
                </Badge>
                <Badge color="amber">Late: {attendanceSummary.late}</Badge>
                <Badge color="red">Absent: {attendanceSummary.absent}</Badge>
                <span className="ml-auto text-sm font-bold text-slate-600">
                  {attendanceSummary.percentage}% Overall
                </span>
              </div>
              <Table
                headers={['Date', 'Subject', 'Status']}
              >
                {attendance.slice(0, 50).map((rec) => {
                  const subj = subjectMap.get(rec.subject_id);
                  return (
                    <TableRow key={rec.id}>
                      <TableCell>
                        {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {subj ? `${subj.subject_code} - ${subj.subject_name}` : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rec.status === 'present' && (
                          <Badge color="green">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Present
                          </Badge>
                        )}
                        {rec.status === 'late' && (
                          <Badge color="amber">
                            <Clock className="mr-1 h-3 w-3" /> Late
                          </Badge>
                        )}
                        {rec.status === 'absent' && (
                          <Badge color="red">
                            <XCircle className="mr-1 h-3 w-3" /> Absent
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
              {attendance.length > 50 && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  Showing 50 of {attendance.length} records
                </p>
              )}
            </>
          )}
        </Card>
      )}

      {activeTab === 'marks' && (
        <Card className="p-6">
          {marks.length === 0 ? (
            <EmptyState
              icon={<Award className="h-8 w-8" />}
              title="No marks recorded"
              description="Internal, assignment, and exam marks will appear here."
            />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-slate-700">
                    {academicSummary.avgInternal ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">Avg Internal</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-slate-700">
                    {academicSummary.avgAssignment ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">Avg Assignment</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-slate-700">
                    {academicSummary.avgExam ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">Avg Exam</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className={`text-lg font-bold ${academicSummary.grade.color}`}>
                    {academicSummary.grade.grade}
                  </p>
                  <p className="text-xs text-slate-400">Grade</p>
                </div>
              </div>
              <Table headers={['Subject', 'Internal', 'Assignment', 'Exam', 'Total', 'Grade']}>
                {marks.map((m) => {
                  const subj = subjectMap.get(m.subject_id);
                  const total = (m.internal_marks + m.assignment_marks + m.exam_marks) / 3;
                  const grade = computeGrade(total);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {subj ? subj.subject_name : '—'}
                      </TableCell>
                      <TableCell>{m.internal_marks}</TableCell>
                      <TableCell>{m.assignment_marks}</TableCell>
                      <TableCell>{m.exam_marks}</TableCell>
                      <TableCell className="font-semibold">
                        {Math.round(total * 100) / 100}
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${grade.color}`}>{grade.grade}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            </>
          )}
        </Card>
      )}

      {activeTab === 'subjects' && (
        <Card className="p-6">
          {subjects.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No subjects enrolled"
              description="Subjects for this student's course will appear here."
            />
          ) : (
            <Table headers={['Code', 'Subject', 'Semester', 'Credits', 'Faculty']}>
              {subjects.map((subj) => (
                <TableRow key={subj.id}>
                  <TableCell className="font-mono text-xs font-semibold text-blue-600">
                    {subj.subject_code}
                  </TableCell>
                  <TableCell className="font-medium">{subj.subject_name}</TableCell>
                  <TableCell>Semester {subj.semester}</TableCell>
                  <TableCell>{subj.credits} credits</TableCell>
                  <TableCell>{subj.faculty}</TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'assignments' && (
        <Card className="p-6">
          {assignments.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No assignments"
              description="Assignments will appear here once assigned."
            />
          ) : (
            <Table headers={['Title', 'Subject', 'Deadline', 'Status', 'Marks']}>
              {assignments.map((a) => {
                const subj = subjectMap.get(a.subject_id);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="text-xs">
                      {subj ? subj.subject_code : '—'}
                    </TableCell>
                    <TableCell>
                      {a.deadline
                        ? new Date(a.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {a.status === 'graded' && <Badge color="green">Graded</Badge>}
                      {a.status === 'submitted' && <Badge color="blue">Submitted</Badge>}
                      {a.status === 'pending' && <Badge color="amber">Pending</Badge>}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {a.marks !== null ? a.marks : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {/* Edit Modal */}
      <EditProfileModal
        open={editOpen}
        student={student}
        courses={allCourses}
        saving={editSaving}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

function EditProfileModal({
  open,
  student,
  courses,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  student: Student;
  courses: Course[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: Partial<Student>) => void;
}) {
  const [form, setForm] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone,
    date_of_birth: student.date_of_birth || '',
    gender: student.gender || '',
    address: student.address || '',
    course_id: student.course_id || '',
    semester: String(student.semester),
    section: student.section || '',
    photo_url: student.photo_url || '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        name: student.name,
        email: student.email,
        phone: student.phone,
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        address: student.address || '',
        course_id: student.course_id || '',
        semester: String(student.semester),
        section: student.section || '',
        photo_url: student.photo_url || '',
      });
    }
  }, [open, student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      email: form.email,
      phone: form.phone,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      address: form.address || null,
      course_id: form.course_id || null,
      semester: parseInt(form.semester) || 1,
      section: form.section || null,
      photo_url: form.photo_url || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Student Profile" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          <Select
            label="Course"
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_id} - {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Semester"
            type="number"
            min={1}
            max={10}
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          />
          <Input
            label="Section"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />
        </div>
        <TextArea
          label="Address"
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Input
          label="Photo URL"
          value={form.photo_url}
          onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} className="flex-1">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
