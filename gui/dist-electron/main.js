"use strict";
const electron = require("electron");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const CLI_ROOT$1 = path.resolve(__dirname, "../../..");
function runCli$1(args) {
  return new Promise((resolve, reject) => {
    child_process.execFile(
      "npx",
      ["tsx", path.join(CLI_ROOT$1, "src/index.ts"), ...args],
      { cwd: CLI_ROOT$1, shell: true },
      (error, stdout, stderr) => {
        if (error) {
          reject({ stdout, stderr, error });
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}
function registerConvertHandlers() {
  electron.ipcMain.handle(
    "convert:run",
    async (_e, opts) => {
      const results = [];
      for (const target of opts.targets) {
        try {
          const args = [
            "convert",
            opts.source,
            "--to",
            target,
            "--output",
            opts.output,
            "--agent-mode",
            opts.agentMode,
            "--permissions",
            opts.permissions
          ];
          const { stdout } = await runCli$1(args);
          results.push({ target, status: "success", output: stdout });
        } catch (err) {
          results.push({
            target,
            status: "error",
            output: "",
            error: err.stderr || err.message
          });
        }
      }
      return results;
    }
  );
}
const PLUGINS_DIR = path.resolve(__dirname, "../../../plugins");
function registerPluginHandlers() {
  electron.ipcMain.handle("plugins:list", async () => {
    try {
      const entries = await fs.promises.readdir(PLUGINS_DIR, { withFileTypes: true });
      const plugins = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const pluginJsonPath = path.join(
          PLUGINS_DIR,
          entry.name,
          ".claude-plugin",
          "plugin.json"
        );
        try {
          const raw = await fs.promises.readFile(pluginJsonPath, "utf8");
          const manifest = JSON.parse(raw);
          plugins.push({
            name: entry.name,
            displayName: manifest.name || entry.name,
            description: manifest.description || "",
            version: manifest.version || "0.0.0",
            path: path.join(PLUGINS_DIR, entry.name)
          });
        } catch {
        }
      }
      return plugins;
    } catch {
      return [];
    }
  });
  electron.ipcMain.handle("plugins:details", async (_e, name) => {
    const pluginPath = path.join(PLUGINS_DIR, name);
    const result = {
      name,
      path: pluginPath,
      agents: [],
      commands: [],
      skills: []
    };
    try {
      const agentsDir = path.join(pluginPath, "agents");
      const agents = await fs.promises.readdir(agentsDir);
      result.agents = agents.filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", ""));
    } catch {
    }
    try {
      const commandsDir = path.join(pluginPath, "commands");
      result.commands = await countFiles(commandsDir, ".md");
    } catch {
    }
    try {
      const skillsDir = path.join(pluginPath, "skills");
      const skills = await fs.promises.readdir(skillsDir, { withFileTypes: true });
      result.skills = skills.filter((s) => s.isDirectory()).map((s) => s.name);
    } catch {
    }
    return result;
  });
}
async function countFiles(dir, ext) {
  const items = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(ext)) {
      items.push(entry.name.replace(ext, ""));
    } else if (entry.isDirectory()) {
      const sub = await countFiles(path.join(dir, entry.name), ext);
      items.push(...sub.map((s) => `${entry.name}/${s}`));
    }
  }
  return items;
}
const CLI_ROOT = path.resolve(__dirname, "../../..");
function runCli(args) {
  return new Promise((resolve, reject) => {
    child_process.execFile(
      "npx",
      ["tsx", path.join(CLI_ROOT, "src/index.ts"), ...args],
      { cwd: CLI_ROOT, shell: true },
      (error, stdout, stderr) => {
        if (error) reject({ stdout, stderr, error });
        else resolve({ stdout, stderr });
      }
    );
  });
}
function registerSyncHandlers() {
  electron.ipcMain.handle(
    "sync:run",
    async (_e, opts) => {
      try {
        const args = ["sync", "--target", opts.target];
        if (opts.output) args.push("--output", opts.output);
        if (opts.claudeHome) args.push("--claude-home", opts.claudeHome);
        const { stdout } = await runCli(args);
        return { status: "success", output: stdout };
      } catch (err) {
        return {
          status: "error",
          output: "",
          error: err.stderr || err.message
        };
      }
    }
  );
}
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.app.whenReady().then(() => {
  registerConvertHandlers();
  registerSyncHandlers();
  registerPluginHandlers();
  electron.ipcMain.handle("dialog:openDirectory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return result.canceled ? null : result.filePaths[0];
  });
  electron.ipcMain.handle("shell:openPath", async (_e, filePath) => {
    await electron.shell.openPath(filePath);
  });
  electron.ipcMain.handle("app:getVersion", () => electron.app.getVersion());
  createWindow();
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
