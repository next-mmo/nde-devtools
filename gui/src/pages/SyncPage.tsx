import { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  HardDrive,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useSync } from '../hooks/use-api';
import { cn } from '../lib/utils';
import { ALL_TARGETS, useAppStore } from '../stores/app-store';

export function SyncPage() {
  const syncMutation = useSync();
  const currentProject = useAppStore((s) => s.currentProject);
  const [target, setTarget] = useState('antigravity');
  const [outputMode, setOutputMode] = useState<'global' | 'local'>('global');
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    output: string;
    error?: string;
  } | null>(null);

  const resolvedOutputPath =
    outputMode === 'local' ? currentProject?.path : undefined;

  async function handleSync() {
    setIsSyncing(true);
    setResult(null);
    try {
      const res = await syncMutation.mutateAsync({
        target,
        output: resolvedOutputPath,
      });
      setResult(res);
    } catch (err: any) {
      setResult({ status: 'error', output: '', error: err.message });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Sync Config</h2>
        <p className="text-muted-foreground">
          Sync your personal{' '}
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
            ~/.claude/
          </code>{' '}
          config to other AI coding tools
        </p>
      </div>

      {/* What gets synced */}
      <div className="border-border bg-card/50 space-y-3 rounded-xl border p-5">
        <h3 className="text-sm font-semibold">What gets synced:</h3>
        <div className="grid grid-cols-3 gap-3">
          <SyncItem emoji="📁" label="Skills" desc="~/.claude/skills/" />
          <SyncItem emoji="⚡" label="Commands" desc="~/.claude/commands/" />
          <SyncItem emoji="🔌" label="MCP Servers" desc="settings.json" />
        </div>
      </div>

      {/* Target */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Target
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setTarget('all')}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-semibold transition-all',
              target === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30',
            )}
          >
            ✨ All
          </button>
          {ALL_TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                target === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Output mode */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Output Directory
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOutputMode('global')}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
              outputMode === 'global'
                ? 'border-primary bg-primary/10 shadow-primary/10 shadow-sm'
                : 'border-border hover:border-primary/30 hover:bg-card',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                outputMode === 'global'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Global</p>
              <p className="text-muted-foreground truncate font-mono text-xs">
                ~/.claude/
              </p>
            </div>
          </button>
          <button
            onClick={() => setOutputMode('local')}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
              outputMode === 'local'
                ? 'border-primary bg-primary/10 shadow-primary/10 shadow-sm'
                : 'border-border hover:border-primary/30 hover:bg-card',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                outputMode === 'local'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <HardDrive className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Local</p>
              <p className="text-muted-foreground truncate font-mono text-xs">
                {currentProject?.path || 'No project selected'}
              </p>
            </div>
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          {outputMode === 'global'
            ? 'Syncs to your global home directory (~/.claude/).'
            : 'Syncs to the project directory. Auto-adds to .gitignore.'}
        </p>
      </div>

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all',
          isSyncing
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25 shadow-lg',
        )}
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync to {target}
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div
          className={cn(
            'animate-fade-in flex items-start gap-3 rounded-lg border p-4',
            result.status === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-destructive/30 bg-destructive/5',
          )}
        >
          {result.status === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="text-destructive h-5 w-5" />
          )}
          <div>
            <p className="font-medium">
              {result.status === 'success' ? 'Sync complete!' : 'Sync failed'}
            </p>
            {result.output && (
              <p className="text-muted-foreground mt-1 font-mono text-sm whitespace-pre-wrap">
                {result.output.trim()}
              </p>
            )}
            {result.error && (
              <p className="text-destructive mt-1 text-sm">{result.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SyncItem({
  emoji,
  label,
  desc,
}: {
  emoji: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="bg-background/50 flex items-center gap-3 rounded-lg p-3">
      <span className="text-lg">{emoji}</span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground font-mono text-xs">{desc}</p>
      </div>
    </div>
  );
}
