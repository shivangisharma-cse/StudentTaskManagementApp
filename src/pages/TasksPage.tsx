import { useEffect, useState, useCallback, useMemo } from 'react';
import TaskList from '@/components/TaskList';
import { PageHeader, ErrorBanner } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import type { StatusFilter, PriorityFilter } from '@/components/SearchFilterBar';
import { supabase, type Task, type TaskInsert } from '@/lib/supabase';

export default function TasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('completed', { ascending: true })
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      setError('Could not load your tasks. Please try again.');
      return;
    }
    setTasks(data as Task[]);
    setError(null);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTasks();
      setLoading(false);
    })();
  }, [fetchTasks]);

  const handleAdd = async (task: TaskInsert) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    setTasks((prev) => [...prev, data as Task]);
    showToast('Task added successfully.');
  };

  const handleToggle = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      showToast('Could not update the task.', 'error');
      return;
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
    );
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      showToast('Could not delete the task.', 'error');
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted.');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter === 'pending' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(q);
        const inDesc = task.description?.toLowerCase().includes(q) ?? false;
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${pendingCount} pending · ${completedCount} completed`}
      />

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <TaskList
        tasks={tasks}
        filteredTasks={filteredTasks}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        onAdd={handleAdd}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
