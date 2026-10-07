import { useState } from 'react';
import Sidebar, { TopNav, type Page } from '@/components/Layout';
import { ToastProvider } from '@/components/ui/Toast';
import StudentsPage from '@/pages/StudentsPage';
import StudentProfilePage from '@/pages/StudentProfilePage';
import CoursesPage from '@/pages/CoursesPage';
import SubjectsPage from '@/pages/SubjectsPage';
import TasksPage from '@/pages/TasksPage';

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  'student-profile': 'Student Profile',
  courses: 'Courses',
  subjects: 'Subjects',
  tasks: 'Tasks',
};

function AppContent() {
  const [page, setPage] = useState<Page>('students');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigate = (next: Page) => {
    if (next !== 'student-profile') {
      setSelectedStudentId(null);
    }
    setPage(next);
  };

  const handleViewStudent = (id: string) => {
    setSelectedStudentId(id);
    setPage('student-profile');
  };

  const handleBackFromProfile = () => {
    setSelectedStudentId(null);
    setPage('students');
  };

  const renderPage = () => {
    switch (page) {
      case 'students':
        return <StudentsPage onViewStudent={handleViewStudent} />;
      case 'student-profile':
        return selectedStudentId ? (
          <StudentProfilePage studentId={selectedStudentId} onBack={handleBackFromProfile} />
        ) : (
          <StudentsPage onViewStudent={handleViewStudent} />
        );
      case 'courses':
        return <CoursesPage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'tasks':
        return <TasksPage />;
      default:
        return <StudentsPage onViewStudent={handleViewStudent} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        current={page}
        onNavigate={handleNavigate}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <TopNav
          onMobileMenu={() => setMobileSidebarOpen(true)}
          title={PAGE_TITLES[page]}
        />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
