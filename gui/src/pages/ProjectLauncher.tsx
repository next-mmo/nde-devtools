import {
  Clock,
  FolderOpen,
  FolderPlus,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { type RecentProject, useAppStore } from '../stores/app-store';

export function ProjectLauncher() {
  const { recentProjects, openProject, removeRecentProject } = useAppStore();

  async function handleBrowse() {
    let selectedPath: string | undefined;

    if (window.api?.openDirectory) {
      // Electron — native directory picker
      selectedPath = await window.api.openDirectory();
    } else {
      // Fallback for dev/browser
      const input = prompt(
        'Enter a project directory path:',
        'C:\\Projects\\my-plugin',
      );
      if (input) selectedPath = input;
    }

    if (selectedPath) {
      openProject({
        path: selectedPath,
        name: selectedPath.split(/[\\/]/).pop() || selectedPath,
        lastOpened: new Date().toISOString(),
      });
    }
  }

  function handleOpenRecent(project: RecentProject) {
    openProject({
      ...project,
      lastOpened: new Date().toISOString(),
    });
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden">
      {/* Drag region for Electron title bar */}
      <div className="drag-region fixed inset-x-0 top-0 z-50 h-8" />

      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 -left-1/2 h-[200%] w-[200%] animate-[spin_60s_linear_infinite] rounded-full blur-3xl" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[100%] w-[100%] animate-[spin_45s_linear_infinite_reverse] rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="animate-fade-in relative z-10 flex w-full max-w-2xl flex-col items-center px-6">
        {/* Logo & Branding */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="from-primary/30 to-primary/10 relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg">
            <Zap className="text-primary h-8 w-8" />
            <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-2xl" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              NDE <span className="text-primary">DevTools</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Plugin Converter for AI Coding Tools
            </p>
          </div>
        </div>

        {/* Open Project Button */}
        <button
          onClick={handleBrowse}
          className="group border-border bg-card/80 hover:border-primary/40 hover:bg-card mb-8 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
        >
          <div className="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300">
            <FolderPlus className="text-primary h-6 w-6" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-base font-semibold">Open Project</p>
            <p className="text-muted-foreground text-sm">
              Browse for a Claude plugin directory
            </p>
          </div>
          <FolderOpen className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
        </button>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Clock className="text-muted-foreground h-3.5 w-3.5" />
              <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Recent Projects
              </h2>
            </div>
            <div className="space-y-1.5">
              {recentProjects.map((project) => (
                <RecentProjectCard
                  key={project.path}
                  project={project}
                  onOpen={() => handleOpenRecent(project)}
                  onRemove={() => removeRecentProject(project.path)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentProjects.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-6">
            <Sparkles className="h-8 w-8 opacity-30" />
            <p className="text-sm">No recent projects</p>
            <p className="text-xs opacity-60">
              Open a project folder to get started
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-muted-foreground/50 mt-10 text-[10px]">
          NDE DevTools — Built with ♥ for AI devs
        </div>
      </div>
    </div>
  );
}

function RecentProjectCard({
  project,
  onOpen,
  onRemove,
}: {
  project: RecentProject;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const timeAgo = getTimeAgo(project.lastOpened);

  return (
    <div
      className={cn(
        'group border-border bg-card/60 hover:bg-card hover:border-primary/20 flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 backdrop-blur-sm transition-all duration-200 hover:shadow-md',
      )}
      onClick={onOpen}
    >
      <div className="bg-primary/8 group-hover:bg-primary/15 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors">
        <FolderOpen className="text-primary/70 group-hover:text-primary h-4 w-4 transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{project.name}</p>
        <p className="text-muted-foreground truncate text-xs">{project.path}</p>
      </div>
      <span className="text-muted-foreground/60 flex-shrink-0 text-[10px]">
        {timeAgo}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-muted-foreground hover:text-destructive flex-shrink-0 rounded-md p-1 opacity-0 transition-all group-hover:opacity-100"
        title="Remove from recent"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
