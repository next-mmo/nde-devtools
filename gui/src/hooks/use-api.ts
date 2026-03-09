import { useLiveQuery } from '@tanstack/react-db';
import { useMutation } from '@tanstack/react-query';
import {
  addConversion,
  conversionsCollection,
  preferencesCollection,
} from '../db/collections';

const isElectron = !!window.api;

// Plugins — IPC or HTTP
export function usePlugins() {
  return {
    data: [] as Array<{
      name: string;
      displayName: string;
      description: string;
      version: string;
      path: string;
    }>,
    isLoading: false,
  };
}

// Convert — IPC to main process, or HTTP to Vite API server
export function useConvert() {
  return useMutation({
    mutationFn: async (opts: {
      source: string;
      targets: string[];
      output: string;
      agentMode: string;
      permissions: string;
    }) => {
      const pluginName = opts.source.split(/[\\/]/).pop() || opts.source;

      if (isElectron) {
        const results = await window.api.convert(opts);
        for (const r of results) {
          addConversion({
            pluginName,
            target: r.target,
            outputPath: opts.output,
            filesCreated: 0,
            status: r.status as 'success' | 'error',
            error: r.error,
          });
        }
        return results;
      }

      // Browser — call Vite API server
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const results = await res.json();

      for (const r of results) {
        addConversion({
          pluginName,
          target: r.target,
          outputPath: opts.output,
          filesCreated: 0,
          status: r.status as 'success' | 'error',
          error: r.error,
        });
      }
      return results;
    },
  });
}

// Sync — IPC to main process, or HTTP to Vite API server
export function useSync() {
  return useMutation({
    mutationFn: async (opts: {
      target: string;
      output?: string;
      claudeHome?: string;
    }) => {
      if (isElectron) {
        const result = await window.api.sync(opts);
        addConversion({
          pluginName: '~/.claude',
          target: opts.target,
          outputPath: opts.output || '~/',
          filesCreated: 0,
          status: result.status as 'success' | 'error',
          error: result.error,
        });
        return result;
      }

      // Browser — call Vite API server
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();

      addConversion({
        pluginName: '~/.claude',
        target: opts.target,
        outputPath: opts.output || '~/',
        filesCreated: 0,
        status: result.status as 'success' | 'error',
        error: result.error,
      });
      return result;
    },
  });
}

// History — TanStack DB live query (reactive, persisted to localStorage)
export function useHistory() {
  return useLiveQuery((q) =>
    q
      .from({ c: conversionsCollection })
      .orderBy(({ c }) => c.createdAt, 'desc'),
  );
}

// Preferences — TanStack DB live query
export function usePreference(key: string) {
  const result = useLiveQuery((q) =>
    q.from({ p: preferencesCollection }).where(({ p }) => p.id === key),
  );
  return result.data?.[0]?.value;
}
