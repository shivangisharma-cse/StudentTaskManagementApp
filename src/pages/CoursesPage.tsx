import { useEffect, useState, useMemo, useCallback } from 'react';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
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
import { supabase, type Course, type CourseInsert } from '@/lib/supabase';

export default function CoursesPage() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');
    if (error) {
      setError('Could not load courses.');
      setLoading(false);
      return;
    }
    setCourses(data as Course[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.course_id.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const openAdd = () => {
    setEditingCourse(null);
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setModalOpen(true);
  };

  const handleSave = async (data: CourseInsert) => {
    setSaving(true);
    if (editingCourse) {
      const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', editingCourse.id);
      if (error) {
        showToast('Failed to update course.', 'error');
        setSaving(false);
        return;
      }
      showToast('Course updated successfully.');
    } else {
      const { error } = await supabase.from('courses').insert(data);
      if (error) {
        showToast('Failed to add course.', 'error');
        setSaving(false);
        return;
      }
      showToast('Course added successfully.');
    }
    setSaving(false);
    setModalOpen(false);
    fetchCourses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', deleteTarget.id);
    if (error) {
      showToast('Failed to delete course.', 'error');
      setDeleting(false);
      return;
    }
    showToast('Course deleted successfully.');
    setDeleting(false);
    setDeleteTarget(null);
    fetchCourses();
  };

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} courses available`}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <Card className="mb-5 p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, ID, or department..."
        />
      </Card>

      {loading ? (
        <LoadingOverlay />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No courses found"
            description={
              search
                ? 'Try adjusting your search.'
                : 'Add your first course to get started.'
            }
            action={
              !search && (
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Table headers={['Course ID', 'Name', 'Department', 'Duration', 'Semesters', 'Actions']}>
          {filtered.map((course) => (
            <TableRow key={course.id}>
              <TableCell>
                <Badge color="blue">{course.course_id}</Badge>
              </TableCell>
              <TableCell className="font-medium">{course.name}</TableCell>
              <TableCell>{course.department}</TableCell>
              <TableCell>{course.duration_years} years</TableCell>
              <TableCell>{course.num_semesters}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(course)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(course)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <CourseFormModal
        open={modalOpen}
        editing={editingCourse}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all subjects in this course.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

function CourseFormModal({
  open,
  editing,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Course | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: CourseInsert) => void;
}) {
  const [form, setForm] = useState({
    course_id: '',
    name: '',
    department: '',
    duration_years: '3',
    num_semesters: '6',
  });

  useEffect(() => {
    if (open) {
      setForm({
        course_id: editing?.course_id || '',
        name: editing?.name || '',
        department: editing?.department || '',
        duration_years: String(editing?.duration_years || 3),
        num_semesters: String(editing?.num_semesters || 6),
      });
    }
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      course_id: form.course_id.trim(),
      name: form.name.trim(),
      department: form.department.trim(),
      duration_years: parseInt(form.duration_years) || 3,
      num_semesters: parseInt(form.num_semesters) || 6,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Course' : 'Add New Course'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Course ID"
          required
          placeholder="e.g. BCA"
          value={form.course_id}
          onChange={(e) => setForm({ ...form, course_id: e.target.value })}
        />
        <Input
          label="Course Name"
          required
          placeholder="e.g. Bachelor of Computer Applications"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Department"
          required
          placeholder="e.g. Computer Science"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Duration (Years)"
            type="number"
            min={1}
            max={10}
            required
            value={form.duration_years}
            onChange={(e) => setForm({ ...form, duration_years: e.target.value })}
          />
          <Input
            label="Number of Semesters"
            type="number"
            min={1}
            max={20}
            required
            value={form.num_semesters}
            onChange={(e) => setForm({ ...form, num_semesters: e.target.value })}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={saving} className="flex-1">
            {editing ? 'Save Changes' : 'Add Course'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
