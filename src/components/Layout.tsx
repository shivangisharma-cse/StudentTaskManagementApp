import { useState } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Library,
  CheckSquare,
  Menu,
  X,
} from 'lucide-react';

export type Page =
  | 'dashboard'
  | 'students'
  | 'student-profile'
  | 'courses'
  | 'subjects'
  | 'tasks';

interface SidebarProps {
  current: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: typeof Users }[] = [
  { id: 'students', label: 'Students', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'subjects', label: 'Subjects', icon: Library },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
];

export default function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const handleNav = (page: Page) => {
    onNavigate(page);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">EduAdmin</h1>
            <p className="text-xs text-slate-400">College Portal</p>
          </div>
          <button
            onClick={onMobileClose}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = current === item.id || (current === 'student-profile' && item.id === 'students');
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`}
                />
                {item.label}
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">Academic Year</p>
            <p className="mt-0.5 text-sm font-bold text-slate-800">2026 – 2027</p>
          </div>
        </div>
      </aside>
    </>
  );
}

interface TopNavProps {
  onMobileMenu: () => void;
  title: string;
}

export function TopNav({ onMobileMenu, title }: TopNavProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-5 backdrop-blur-md">
      <button
        onClick={onMobileMenu}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            AD
          </div>
          <span className="text-sm font-medium text-slate-600">Admin</span>
        </div>
      </div>
    </header>
  );
}

export function useMobileSidebar() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
