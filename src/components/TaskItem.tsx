import { Calendar, Check, Trash2, Clock } from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { PRIORITY_CONFIG } from '@/lib/supabase';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(deadline: string | null, completed: boolean): boolean {
  if (!deadline || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + 'T00:00:00');
  return due < today;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const overdue = isOverdue(task.deadline, task.completed);
  const prio = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={`slide-up group flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        task.completed
          ? 'border-slate-100 opacity-75'
          : overdue
            ? 'border-red-200'
            : 'border-slate-200'
      }`}
    >
      <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${prio.dot}`} />

      <button
        onClick={() => onToggle(task.id, task.completed)}
        className={`mt-0 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          task.completed
            ? 'check-pop border-emerald-500 bg-emerald-500'
            : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
        }`}
        aria-label={task.completed ? 'Mark as pending' : 'Mark as completed'}
      >
        {task.completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4
            className={`text-sm font-medium ${
              task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}
          >
            {task.title}
          </h4>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${prio.badge}`}
          >
            {prio.label}
          </span>
        </div>
        {task.description && (
          <p
            className={`mt-1 text-sm ${
              task.completed ? 'text-slate-300 line-through' : 'text-slate-500'
            }`}
          >
            {task.description}
          </p>
        )}
        {task.deadline && (
          <div className="mt-2 flex items-center gap-1.5">
            {overdue ? (
              <Clock className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span
              className={`text-xs font-medium ${
                overdue ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              {overdue ? 'Overdue - ' : 'Due '}
              {formatDate(task.deadline)}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-100 transition-all hover:bg-red-50 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
