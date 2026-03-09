"use strict";
const electron = require("electron");
const api = {
  // Convert
  convert: (opts) => electron.ipcRenderer.invoke("convert:run", opts),
  // Sync
  sync: (opts) => electron.ipcRenderer.invoke("sync:run", opts),
  // Plugins
  listPlugins: () => electron.ipcRenderer.invoke("plugins:list"),
  getPluginDetails: (name) => electron.ipcRenderer.invoke("plugins:details", name),
  // Dialogs
  openDirectory: () => electron.ipcRenderer.invoke("dialog:openDirectory"),
  openPath: (path) => electron.ipcRenderer.invoke("shell:openPath", path),
  // App
  getVersion: () => electron.ipcRenderer.invoke("app:getVersion")
};
electron.contextBridge.exposeInMainWorld("api", api);
