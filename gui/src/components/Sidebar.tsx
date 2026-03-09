import {
  ArrowRightLeft,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { type Page, useAppStore } from '../stores/app-store';

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'convert', label: 'Convert', icon: ArrowRightLeft },
  { page: 'sync', label: 'Sync', icon: RefreshCw },
  { page: 'history', label: 'History', icon: History },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { page, setPage, currentProject, closeProject } = useAppStore();

  return (
    <aside className="border-border bg-card/50 flex w-[220px] flex-col border-r backdrop-blur-sm">
      {/* Title bar drag region */}
      <div className="drag-region flex items-center gap-2.5 px-5 pt-7 pb-4">
        <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
          <Zap className="text-primary h-4 w-4" />
        </div>
        <div className="no-drag">
          <h1 className="text-sm font-bold tracking-tight">NDE DevTools</h1>
          <p className="text-muted-foreground text-[10px]">Plugin Converter</p>
        </div>
      </div>

      {/* Current project indicator */}
      {currentProject && (
        <div className="border-border mx-3 mb-3 rounded-lg border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <FolderOpen className="text-primary h-3.5 w-3.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {currentProject.name}
              </p>
              <p className="text-muted-foreground truncate text-[10px]">
                {currentProject.path}
              </p>
            </div>
          </div>
          <button
            onClick={closeProject}
            className="no-drag text-muted-foreground hover:text-primary hover:bg-accent mt-2 flex w-full items-center justify-center gap-1.5 rounded-md py-1 text-[10px] font-medium transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Switch Project
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ page: p, label, icon: Icon }) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              page === p
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-border border-t px-5 py-4">
        <p className="text-muted-foreground text-[10px]">
          Built with ♥ for AI devs
        </p>
      </div>
    </aside>
  );
}
