import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, PageName, AppState } from './types';
import { useAppState } from './hooks/useAppState';
import { Spinner, useToast } from './components/ui';
import { Sidebar } from './components/Sidebar';
import { GlobalSearch } from './components/GlobalSearch';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { TeachersPage } from './pages/TeachersPage';
import { StaffPage } from './pages/StaffPage';
import { ClassesPage } from './pages/ClassesPage';
import { FinancesPage } from './pages/FinancesPage';
import { TimetablePage } from './pages/TimetablePage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';

const PageRouter = ({
  activePage,
  state,
  updateState,
}: {
  activePage: PageName;
  state: AppState;
  updateState: (updater: (prevState: AppState) => AppState) => void;
}) => {
  switch (activePage) {
    case 'Dashboard': return <DashboardPage state={state} />;
    case 'Students': return <StudentsPage state={state} updateState={updateState} />;
    case 'Teachers': return <TeachersPage state={state} updateState={updateState} />;
    case 'Staff': return <StaffPage state={state} updateState={updateState} />;
    case 'Classes': return <ClassesPage state={state} updateState={updateState} />;
    case 'Finances': return <FinancesPage state={state} updateState={updateState} />;
    case 'Reports': return <ReportsPage state={state} />;
    case 'Alerts': return <AlertsPage state={state} />;
    case 'Timetable': return <TimetablePage state={state} updateState={updateState} />;
    case 'Users': return <UsersPage state={state} updateState={updateState} />;
    case 'Settings': return <SettingsPage state={state} updateState={updateState} />;
    default: return <div className="p-6">Page non trouvee</div>;
  }
};

const App = () => {
  const [state, updateState] = useAppState();
  const [activePage, setActivePage] = useState<PageName>('Dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useToast();
  const lastBackupRef = useRef(Date.now());

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K: Global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      // Escape: Close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Auto-backup reminder
  useEffect(() => {
    if (!state.settings.auto_backup_enabled || !state.currentUser) return;
    const intervalMs = (state.settings.auto_backup_interval_minutes || 30) * 60 * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastBackupRef.current >= intervalMs) {
        lastBackupRef.current = now;
        toast('Sauvegarde automatique effectuee', 'info');
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [state.settings.auto_backup_enabled, state.settings.auto_backup_interval_minutes, state.currentUser, toast]);

  const handleLogin = useCallback(
    (user: User) => {
      updateState((prev) => ({ ...prev, currentUser: user }));
    },
    [updateState],
  );

  const handleLogout = useCallback(() => {
    updateState((prev) => ({ ...prev, currentUser: null }));
    setActivePage('Dashboard');
  }, [updateState]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg-dark">
        <Spinner />
      </div>
    );
  }

  if (!state.currentUser) {
    return <LoginPage state={state} onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        currentUser={state.currentUser}
        onLogout={handleLogout}
        onSearchOpen={() => setSearchOpen(true)}
        settings={state.settings}
      />
      <main className="flex-1 overflow-x-hidden">
        <PageRouter activePage={activePage} state={state} updateState={updateState} />
      </main>
      <GlobalSearch
        state={state}
        onNavigate={setActivePage}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default App;
