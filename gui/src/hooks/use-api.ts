import { useLiveQuery } from '@tanstack/react-db';
import { useMutation } from '@tanstack/react-query';
import {
  addConversion,
  conversionsCollection,
  preferencesCollection,
} from '../db/collections';

// Plugins — IPC to main process
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

// Convert — IPC to main process
export function useConvert() {
  return useMutation({
    mutationFn: async (opts: {
      source: string;
      targets: string[];
      output: string;
      agentMode: string;
      permissions: string;
    }) => {
      if (window.api) {
        const results = await window.api.convert(opts);
        for (const r of results) {
          addConversion({
            pluginName: opts.source.split(/[\\/]/).pop() || opts.source,
            target: r.target,
            outputPath: opts.output,
            filesCreated: 0,
            status: r.status as 'success' | 'error',
            error: r.error,
          });
        }
        return results;
      }
      throw new Error('Electron API not available');
    },
  });
}

// Sync — IPC to main process
export function useSync() {
  return useMutation({
    mutationFn: async (opts: {
      target: string;
      output?: string;
      claudeHome?: string;
    }) => {
      if (window.api) {
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
      throw new Error('Electron API not available');
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
