import { useState } from 'react';
import { Plus, Calendar, X, Flag } from 'lucide-react';
import {
  Button,
  Input,
  TextArea,
  Select,
} from '@/components/ui';
import type { TaskInsert, Priority } from '@/lib/supabase';
import { PRIORITY_CONFIG } from '@/lib/supabase';

interface TaskFormProps {
  onAdd: (task: TaskInsert) => Promise<void>;
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export default function TaskForm({ onAdd }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setPriority('medium');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
        priority,
      });
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full border-2 border-dashed py-4"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-5 w-5" />
        Add New Task
      </Button>
    );
  }

  return (
    <div className="slide-up rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">New Task</h3>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen(false);
          }}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <TextArea
          placeholder="Description (optional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:w-44">
            <Flag className="h-4 w-4 text-slate-400" />
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="flex-1"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_CONFIG[p].label} Priority
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={submitting} className="flex-1">
            Add Task
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
