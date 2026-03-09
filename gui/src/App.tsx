import { Sidebar } from './components/Sidebar';
import { ConvertPage } from './pages/ConvertPage';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { ProjectLauncher } from './pages/ProjectLauncher';
import { SettingsPage } from './pages/SettingsPage';
import { SyncPage } from './pages/SyncPage';
import { useAppStore } from './stores/app-store';

export default function App() {
  const page = useAppStore((s) => s.page);
  const currentProject = useAppStore((s) => s.currentProject);

  // Show project launcher if no project is open
  if (!currentProject) {
    return <ProjectLauncher />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="animate-fade-in mx-auto max-w-4xl">
          {page === 'dashboard' && <Dashboard />}
          {page === 'convert' && <ConvertPage />}
          {page === 'sync' && <SyncPage />}
          {page === 'history' && <HistoryPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
