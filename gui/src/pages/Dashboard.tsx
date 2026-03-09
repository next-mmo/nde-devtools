import {
  ArrowRightLeft,
  Bot,
  Layers,
  Package,
  RefreshCw,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { usePlugins } from '../hooks/use-api';
import { ALL_TARGETS, useAppStore } from '../stores/app-store';

export function Dashboard() {
  const { data: plugins } = usePlugins();
  const setPage = useAppStore((s) => s.setPage);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to <span className="text-primary">NDE DevTools</span>
        </h2>
        <p className="text-muted-foreground text-lg">
          Convert Claude Code plugins to any AI coding tool format
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Package}
          label="Plugins Available"
          value={plugins?.length ?? 0}
          gradient="from-violet-500/20 to-purple-500/20"
        />
        <StatCard
          icon={Layers}
          label="Targets Supported"
          value={ALL_TARGETS.length}
          gradient="from-blue-500/20 to-cyan-500/20"
        />
        <StatCard
          icon={Bot}
          label="AI Tools"
          value={ALL_TARGETS.length}
          gradient="from-emerald-500/20 to-green-500/20"
        />
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={ArrowRightLeft}
            title="Convert Plugin"
            description="Convert a Claude plugin to other formats"
            onClick={() => setPage('convert')}
          />
          <QuickAction
            icon={RefreshCw}
            title="Sync Config"
            description="Sync ~/.claude/ config to other tools"
            onClick={() => setPage('sync')}
          />
        </div>
      </div>

      {/* Available plugins */}
      {plugins && plugins.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
            Available Plugins
          </h3>
          <div className="space-y-2">
            {plugins.map((p: any) => (
              <div
                key={p.name}
                className="border-border bg-card/50 hover:bg-card flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md"
                onClick={() => {
                  useAppStore.getState().setSelectedPlugin(p.path);
                  setPage('convert');
                }}
              >
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Sparkles className="text-primary h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{p.displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    {p.description || 'Claude Code plugin'}
                  </p>
                </div>
                <div className="text-muted-foreground font-mono text-xs">
                  v{p.version}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supported targets */}
      <div className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Supported Targets
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALL_TARGETS.map((t) => (
            <span
              key={t}
              className="bg-secondary hover:bg-primary/20 hover:text-primary rounded-full px-3 py-1 text-xs font-medium transition-colors"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <div
      className={`border-border relative overflow-hidden rounded-xl border bg-gradient-to-br ${gradient} p-5`}
    >
      <Icon className="text-foreground/5 absolute -top-2 -right-2 h-16 w-16" />
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group border-border bg-card/50 hover:bg-card hover:border-primary/30 flex items-start gap-4 rounded-xl border p-5 text-left transition-all hover:shadow-lg"
    >
      <div className="bg-primary/10 group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
        <Icon className="text-primary h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </button>
  );
}
