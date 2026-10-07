import { ClipboardList, CheckCircle2, Search } from 'lucide-react';
import TaskForm from '@/components/TaskForm';
import TaskItem from '@/components/TaskItem';
import SearchFilterBar, {
  type StatusFilter,
  type PriorityFilter,
} from '@/components/SearchFilterBar';
import type { Task, TaskInsert } from '@/lib/supabase';
import { PRIORITY_ORDER } from '@/lib/supabase';

interface TaskListProps {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (value: PriorityFilter) => void;
  onAdd: (task: TaskInsert) => Promise<void>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskList({
  tasks,
  filteredTasks,
  loading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  onAdd,
  onToggle,
  onDelete,
}: TaskListProps) {
  const sorted = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const prioDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (prioDiff !== 0) return prioDiff;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  const pendingTasks = sorted.filter((t) => !t.completed);
  const completedTasks = sorted.filter((t) => t.completed);

  const showPendingSection =
    statusFilter === 'all' || statusFilter === 'pending';
  const showCompletedSection =
    statusFilter === 'all' || statusFilter === 'completed';

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  const renderEmptyState = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-slate-200/60"
            />
          ))}
        </div>
      );
    }
    if (hasActiveFilters) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No tasks found</p>
          <p className="mt-1 text-xs text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 py-10 text-center">
        <p className="text-sm text-slate-400">
          No pending tasks. Add one above to get started!
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <TaskForm onAdd={onAdd} />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        priorityFilter={priorityFilter}
        onPriorityChange={onPriorityChange}
        resultCount={filteredTasks.length}
        totalCount={tasks.length}
      />

      {showPendingSection && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Pending
            </h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              {pendingTasks.length}
            </span>
          </div>

          {pendingTasks.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {showCompletedSection && completedTasks.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Completed
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              {completedTasks.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
