import { Search, X, SlidersHorizontal } from 'lucide-react';
import type { Priority } from '@/lib/supabase';

export type StatusFilter = 'all' | 'pending' | 'completed';
export type PriorityFilter = 'all' | Priority;

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  onPriorityChange: (value: PriorityFilter) => void;
  resultCount: number;
  totalCount: number;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function SearchFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  resultCount,
  totalCount,
}: SearchFilterBarProps) {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all';

  const clearAll = () => {
    onSearchChange('');
    onStatusChange('all');
    onPriorityChange('all');
  };

  return (
    <div className="fade-in rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title or description..."
          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-9 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === opt.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:ml-auto">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as PriorityFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-blue-500"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400">
            Showing {resultCount} of {totalCount} tasks
          </p>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
