import { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  HardDrive,
  Loader2,
  Play,
  XCircle,
} from 'lucide-react';
import { useConvert, usePlugins } from '../hooks/use-api';
import { cn } from '../lib/utils';
import { ALL_TARGETS, useAppStore } from '../stores/app-store';

export function ConvertPage() {
  const { data: plugins } = usePlugins();
  const convertMutation = useConvert();
  const {
    selectedPlugin,
    setSelectedPlugin,
    selectedTargets,
    toggleTarget,
    setSelectedTargets,
    isConverting,
    setIsConverting,
    lastResults,
    setLastResults,
    currentProject,
  } = useAppStore();

  const [agentMode, setAgentMode] = useState('subagent');
  const [permissions, setPermissions] = useState('none');
  const [outputMode, setOutputMode] = useState<'project' | 'global'>('project');

  const resolvedOutputPath =
    outputMode === 'project' ? currentProject?.path || '.' : undefined;

  async function handleConvert() {
    if (!selectedPlugin || selectedTargets.length === 0) return;
    setIsConverting(true);
    setLastResults([]);

    try {
      const results = await convertMutation.mutateAsync({
        source: selectedPlugin,
        targets: selectedTargets,
        output: resolvedOutputPath || '.',
        agentMode,
        permissions,
      });
      setLastResults(results);
    } catch (err: any) {
      setLastResults([
        { target: 'all', status: 'error', output: '', error: err.message },
      ]);
    } finally {
      setIsConverting(false);
    }
  }

  const allSelected = selectedTargets.length === ALL_TARGETS.length;
  function toggleAll() {
    setSelectedTargets(allSelected ? [] : [...ALL_TARGETS]);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Convert Plugin</h2>
        <p className="text-muted-foreground">
          Convert a Claude Code plugin to one or more target formats
        </p>
      </div>

      {/* Source plugin */}
      <Section title="Source Plugin">
        <div className="space-y-2">
          {plugins?.map((p: any) => (
            <button
              key={p.name}
              onClick={() => setSelectedPlugin(p.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                selectedPlugin === p.path
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border hover:border-primary/30 hover:bg-card',
              )}
            >
              <div
                className={cn(
                  'h-3 w-3 rounded-full',
                  selectedPlugin === p.path ? 'bg-primary' : 'bg-muted',
                )}
              />
              <div>
                <p className="font-medium">{p.displayName}</p>
                <p className="text-muted-foreground text-xs">{p.path}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Target selection */}
      <Section title="Target Formats">
        <div className="space-y-3">
          <button
            onClick={toggleAll}
            className="text-primary text-xs font-medium hover:underline"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <div className="grid grid-cols-3 gap-2">
            {ALL_TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTarget(t)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                  selectedTargets.includes(t)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Output directory */}
      <Section title="Output Directory">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOutputMode('project')}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 text-left transition-all',
              outputMode === 'project'
                ? 'border-primary bg-primary/10 shadow-primary/10 shadow-sm'
                : 'border-border hover:border-primary/30 hover:bg-card',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg',
                outputMode === 'project'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <HardDrive className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Project</p>
              <p className="text-muted-foreground truncate font-mono text-xs">
                {currentProject?.path || '.'}
              </p>
            </div>
          </button>
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
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {outputMode === 'project'
            ? 'Outputs to the project directory alongside your source plugin.'
            : 'Outputs to global home directory (~/.claude/).'}
        </p>
      </Section>

      {/* Options */}
      <Section title="Options">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Agent Mode
            </label>
            <select
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value)}
              className="border-border bg-background focus:border-primary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
            >
              <option value="subagent">Subagent</option>
              <option value="primary">Primary</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              Permissions
            </label>
            <select
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              className="border-border bg-background focus:border-primary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
            >
              <option value="none">None</option>
              <option value="broad">Broad</option>
              <option value="from-commands">From Commands</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={
          !selectedPlugin || selectedTargets.length === 0 || isConverting
        }
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all',
          !selectedPlugin || selectedTargets.length === 0 || isConverting
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25 hover:shadow-primary/30 shadow-lg hover:shadow-xl',
        )}
      >
        {isConverting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Converting...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Convert to {selectedTargets.length} target
            {selectedTargets.length !== 1 ? 's' : ''}
          </>
        )}
      </button>

      {/* Results */}
      {lastResults.length > 0 && (
        <div className="animate-fade-in space-y-2">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Results
          </h3>
          {lastResults.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                r.status === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-destructive/30 bg-destructive/5',
              )}
            >
              {r.status === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="text-destructive mt-0.5 h-4 w-4" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{r.target}</p>
                {r.output && (
                  <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
                    {r.output.trim()}
                  </p>
                )}
                {r.error && (
                  <p className="text-destructive mt-1 text-xs">{r.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
