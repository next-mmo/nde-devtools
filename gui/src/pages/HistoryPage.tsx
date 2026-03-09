import { CheckCircle2, Clock, FolderOpen, XCircle } from 'lucide-react';
import { useHistory } from '../hooks/use-api';
import { cn } from '../lib/utils';

export function HistoryPage() {
  const { data: history, isLoading } = useHistory(100);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">History</h2>
        <p className="text-muted-foreground">
          Past conversions and sync operations
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}

      {!isLoading && (!history || history.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <p className="text-muted-foreground text-lg font-medium">
            No history yet
          </p>
          <p className="text-muted-foreground text-sm">
            Convert or sync a plugin to see it here
          </p>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="space-y-2">
          {(history as any[]).map((item) => (
            <div
              key={item.id}
              className="border-border bg-card/50 hover:bg-card flex items-center gap-4 rounded-xl border p-4 transition-all"
            >
              {item.status === 'success' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="text-destructive h-5 w-5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{item.plugin_name}</p>
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {item.target}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <FolderOpen className="text-muted-foreground h-3 w-3" />
                  <p className="text-muted-foreground truncate font-mono text-xs">
                    {item.output_path}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs whitespace-nowrap">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
