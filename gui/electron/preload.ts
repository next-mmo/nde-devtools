import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Convert
  convert: (opts: {
    source: string;
    targets: string[];
    output: string;
    agentMode: string;
    permissions: string;
  }) => ipcRenderer.invoke('convert:run', opts),

  // Sync
  sync: (opts: { target: string; output?: string; claudeHome?: string }) =>
    ipcRenderer.invoke('sync:run', opts),

  // Plugins
  listPlugins: () => ipcRenderer.invoke('plugins:list'),
  getPluginDetails: (name: string) =>
    ipcRenderer.invoke('plugins:details', name),

  // Dialogs
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),

  // App
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
