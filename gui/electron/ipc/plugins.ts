import { ipcMain } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

const PLUGINS_DIR = path.resolve(__dirname, '../../../plugins');

export function registerPluginHandlers() {
  ipcMain.handle('plugins:list', async () => {
    try {
      const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
      const plugins = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const pluginJsonPath = path.join(
          PLUGINS_DIR,
          entry.name,
          '.claude-plugin',
          'plugin.json',
        );
        try {
          const raw = await fs.readFile(pluginJsonPath, 'utf8');
          const manifest = JSON.parse(raw);
          plugins.push({
            name: entry.name,
            displayName: manifest.name || entry.name,
            description: manifest.description || '',
            version: manifest.version || '0.0.0',
            path: path.join(PLUGINS_DIR, entry.name),
          });
        } catch {
          // Skip directories without valid plugin.json
        }
      }
      return plugins;
    } catch {
      return [];
    }
  });

  ipcMain.handle('plugins:details', async (_e, name: string) => {
    const pluginPath = path.join(PLUGINS_DIR, name);
    const result: any = {
      name,
      path: pluginPath,
      agents: [],
      commands: [],
      skills: [],
    };

    // Count agents
    try {
      const agentsDir = path.join(pluginPath, 'agents');
      const agents = await fs.readdir(agentsDir);
      result.agents = agents
        .filter((f: string) => f.endsWith('.md'))
        .map((f: string) => f.replace('.md', ''));
    } catch {}

    // Count commands
    try {
      const commandsDir = path.join(pluginPath, 'commands');
      result.commands = await countFiles(commandsDir, '.md');
    } catch {}

    // Count skills
    try {
      const skillsDir = path.join(pluginPath, 'skills');
      const skills = await fs.readdir(skillsDir, { withFileTypes: true });
      result.skills = skills
        .filter((s: any) => s.isDirectory())
        .map((s: any) => s.name);
    } catch {}

    return result;
  });
}

async function countFiles(dir: string, ext: string): Promise<string[]> {
  const items: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(ext)) {
      items.push(entry.name.replace(ext, ''));
    } else if (entry.isDirectory()) {
      const sub = await countFiles(path.join(dir, entry.name), ext);
      items.push(...sub.map((s) => `${entry.name}/${s}`));
    }
  }
  return items;
}
