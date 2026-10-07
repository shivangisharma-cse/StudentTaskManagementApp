import { useEffect, useState, useMemo, useCallback } from 'react';
import { Library, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  Select,
  SearchInput,
  LoadingOverlay,
  EmptyState,
  ErrorBanner,
  ConfirmDialog,
  PageHeader,
  Table,
  TableRow,
  TableCell,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { supabase, type Subject, type SubjectInsert, type Course } from '@/lib/supabase';

export default function SubjectsPage() {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: subjData, error: sErr }, { data: courseData, error: cErr }] =
      await Promise.all([
        supabase.from('subjects').select('*').order('subject_name'),
        supabase.from('courses').select('*').order('name'),
      ]);
    if (sErr || cErr) {
      setError('Could not load subjects.');
      setLoading(false);
      return;
    }
    setSubjects(subjData as Subject[]);
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
    return subjects.filter((s) => {
      if (courseFilter !== 'all' && s.course_id !== courseFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.subject_name.toLowerCase().includes(q) ||
          s.subject_code.toLowerCase().includes(q) ||
          s.faculty.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [subjects, search, courseFilter]);

  const openAdd = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setModalOpen(true);
  };

  const handleSave = async (data: SubjectInsert) => {
    setSaving(true);
    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update(data)
        .eq('id', editingSubject.id);
      if (error) {
        showToast('Failed to update subject.', 'error');
        setSaving(false);
        return;
      }
      showToast('Subject updated successfully.');
    } else {
      const { error } = await supabase.from('subjects').insert(data);
      if (error) {
        showToast('Failed to add subject.', 'error');
        setSaving(false);
        return;
      }
      showToast('Subject added successfully.');
    }
    setSaving(false);
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', deleteTarget.id);
    if (error) {
      showToast('Failed to delete subject.', 'error');
      setDeleting(false);
      return;
    }
    showToast('Subject deleted successfully.');
    setDeleting(false);
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subjects across ${courses.length} courses`}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, code, or faculty..."
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
            icon={<Library className="h-8 w-8" />}
            title="No subjects found"
            description={
              search || courseFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Add your first subject to get started.'
            }
            action={
              !search && courseFilter === 'all' && (
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Add Subject
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Table headers={['Code', 'Subject', 'Course', 'Sem', 'Credits', 'Faculty', 'Actions']}>
          {filtered.map((subject) => {
            const course = courseMap.get(subject.course_id);
            return (
              <TableRow key={subject.id}>
                <TableCell>
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    {subject.subject_code}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{subject.subject_name}</TableCell>
                <TableCell>
                  {course ? (
                    <Badge color="blue">{course.course_id}</Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>Sem {subject.semester}</TableCell>
                <TableCell>{subject.credits}</TableCell>
                <TableCell className="text-xs">{subject.faculty}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(subject)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(subject)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}

      <SubjectFormModal
        open={modalOpen}
        editing={editingSubject}
        courses={courses}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.subject_name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

function SubjectFormModal({
  open,
  editing,
  courses,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Subject | null;
  courses: Course[];
  saving: boolean;
  onClose: () => void;
  onSave: (data: SubjectInsert) => void;
}) {
  const [form, setForm] = useState({
    subject_code: '',
    subject_name: '',
    course_id: '',
    semester: '1',
    credits: '4',
    faculty: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        subject_code: editing?.subject_code || '',
        subject_name: editing?.subject_name || '',
        course_id: editing?.course_id || '',
        semester: String(editing?.semester || 1),
        credits: String(editing?.credits || 4),
        faculty: editing?.faculty || '',
      });
    }
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subject_code: form.subject_code.trim(),
      subject_name: form.subject_name.trim(),
      course_id: form.course_id,
      semester: parseInt(form.semester) || 1,
      credits: parseInt(form.credits) || 4,
      faculty: form.faculty.trim(),
    });
  };

  const selectedCourse = courses.find((c) => c.id === form.course_id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Subject' : 'Add New Subject'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Subject Code"
          required
          placeholder="e.g. BCA101"
          value={form.subject_code}
          onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
        />
        <Input
          label="Subject Name"
          required
          placeholder="e.g. Programming in C"
          value={form.subject_name}
          onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
        />
        <Select
          label="Course"
          required
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
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Semester"
            required
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            disabled={!form.course_id}
          >
            {form.course_id && selectedCourse
              ? Array.from({ length: selectedCourse.num_semesters }, (_, i) => i + 1).map(
                  (sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  )
                )
              : <option value="1">Semester 1</option>}
          </Select>
          <Input
            label="Credits"
            type="number"
            min={1}
            max={10}
            required
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
          />
        </div>
        <Input
          label="Faculty"
          required
          placeholder="e.g. Dr. Rajesh Kumar"
          value={form.faculty}
          onChange={(e) => setForm({ ...form, faculty: e.target.value })}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} className="flex-1">
            {editing ? 'Save Changes' : 'Add Subject'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
