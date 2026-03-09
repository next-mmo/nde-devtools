import { create } from 'zustand';

export type Page = 'dashboard' | 'convert' | 'sync' | 'history' | 'settings';

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

interface AppState {
  // --- Project Launcher ---
  currentProject: RecentProject | null;
  recentProjects: RecentProject[];
  openProject: (project: RecentProject) => void;
  closeProject: () => void;
  removeRecentProject: (path: string) => void;

  // --- IDE pages ---
  page: Page;
  setPage: (page: Page) => void;
  selectedTargets: string[];
  toggleTarget: (target: string) => void;
  setSelectedTargets: (targets: string[]) => void;

  selectedPlugin: string;
  setSelectedPlugin: (plugin: string) => void;
  isConverting: boolean;
  setIsConverting: (v: boolean) => void;
  lastResults: Array<{
    target: string;
    status: string;
    output: string;
    error?: string;
  }>;
  setLastResults: (
    r: Array<{
      target: string;
      status: string;
      output: string;
      error?: string;
    }>,
  ) => void;
}

export const ALL_TARGETS = [
  'opencode',
  'codex',
  'droid',
  'pi',
  'gemini',
  'copilot',
  'kiro',
  'windsurf',
  'qwen',
  'openclaw',
  'antigravity',
] as const;

// Load recent projects from localStorage
function loadRecentProjects(): RecentProject[] {
  try {
    const stored = localStorage.getItem('nde-recent-projects');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentProjects(projects: RecentProject[]) {
  localStorage.setItem('nde-recent-projects', JSON.stringify(projects));
}

export const useAppStore = create<AppState>((set, get) => ({
  // --- Project Launcher ---
  currentProject: null,
  recentProjects: loadRecentProjects(),

  openProject: (project) => {
    const existing = get().recentProjects.filter(
      (p) => p.path !== project.path,
    );
    const updated = [project, ...existing].slice(0, 10); // Keep max 10 recent
    saveRecentProjects(updated);
    set({
      currentProject: project,
      recentProjects: updated,
      page: 'dashboard',
    });
  },

  closeProject: () => {
    set({ currentProject: null, page: 'dashboard' });
  },

  removeRecentProject: (path) => {
    const updated = get().recentProjects.filter((p) => p.path !== path);
    saveRecentProjects(updated);
    set({ recentProjects: updated });
  },

  // --- IDE pages ---
  page: 'dashboard',
  setPage: (page) => set({ page }),
  selectedTargets: ['antigravity'],
  toggleTarget: (target) =>
    set((s) => ({
      selectedTargets: s.selectedTargets.includes(target)
        ? s.selectedTargets.filter((t) => t !== target)
        : [...s.selectedTargets, target],
    })),
  setSelectedTargets: (targets) => set({ selectedTargets: targets }),

  selectedPlugin: '',
  setSelectedPlugin: (plugin) => set({ selectedPlugin: plugin }),
  isConverting: false,
  setIsConverting: (v) => set({ isConverting: v }),
  lastResults: [],
  setLastResults: (r) => set({ lastResults: r }),
}));
