import { useEffect, useState } from 'react';
import { FolderOpen, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [defaultOutput, setDefaultOutput] = useState('.');
  const [claudeHome, setClaudeHome] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  async function handleBrowseOutput() {
    const dir = await window.api.openDirectory();
    if (dir) setDefaultOutput(dir);
  }

  async function handleBrowseClaude() {
    const dir = await window.api.openDirectory();
    if (dir) setClaudeHome(dir);
  }

  function handleSave() {
    window.api.setPreference('theme', theme);
    window.api.setPreference('defaultOutput', defaultOutput);
    if (claudeHome) window.api.setPreference('claudeHome', claudeHome);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your preferences</p>
      </div>

      {/* Theme */}
      <Section title="Appearance">
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-3 transition-all',
              theme === 'dark'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30',
            )}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-3 transition-all',
              theme === 'light'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30',
            )}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
        </div>
      </Section>

      {/* Default output */}
      <Section title="Default Output Directory">
        <div className="flex gap-2">
          <input
            type="text"
            value={defaultOutput}
            onChange={(e) => setDefaultOutput(e.target.value)}
            className="border-border bg-background focus:border-primary focus:ring-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            placeholder="Default output path"
          />
          <button
            onClick={handleBrowseOutput}
            className="border-border hover:bg-accent flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>
      </Section>

      {/* Claude home */}
      <Section title="Claude Home Directory">
        <div className="flex gap-2">
          <input
            type="text"
            value={claudeHome}
            onChange={(e) => setClaudeHome(e.target.value)}
            className="border-border bg-background focus:border-primary focus:ring-primary flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
            placeholder="~/.claude (default)"
          />
          <button
            onClick={handleBrowseClaude}
            className="border-border hover:bg-accent flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          Override the default Claude config directory for sync operations
        </p>
      </Section>

      {/* Save */}
      <button
        onClick={handleSave}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all',
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25 shadow-lg',
        )}
      >
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
