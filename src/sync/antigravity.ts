import path from 'path';
import type { ClaudeHomeConfig } from '../parsers/claude-home';
import type { ClaudeMcpServer } from '../types/claude';
import { syncAntigravityCommands } from './commands';
import { mergeJsonConfigAtKey } from './json-config';
import { syncSkills } from './skills';

type AntigravityMcpServer = {
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
};

export async function syncToAntigravity(
  config: ClaudeHomeConfig,
  outputRoot: string,
): Promise<void> {
  const antigravityDir = resolveAntigravitySyncDir(outputRoot);
  await syncSkills(config.skills, path.join(antigravityDir, 'skills'));
  await syncAntigravityCommands(config, antigravityDir);

  if (Object.keys(config.mcpServers).length > 0) {
    const settingsPath = path.join(antigravityDir, 'settings.json');
    const converted = convertMcpForAntigravity(config.mcpServers);
    await mergeJsonConfigAtKey({
      configPath: settingsPath,
      key: 'mcpServers',
      incoming: converted,
    });
  }
}

function resolveAntigravitySyncDir(outputRoot: string): string {
  const base = path.basename(outputRoot);
  if (base === 'antigravity') return outputRoot;
  if (base === '.gemini') return path.join(outputRoot, 'antigravity');
  return path.join(outputRoot, '.gemini', 'antigravity');
}

function convertMcpForAntigravity(
  servers: Record<string, ClaudeMcpServer>,
): Record<string, AntigravityMcpServer> {
  const result: Record<string, AntigravityMcpServer> = {};
  for (const [name, server] of Object.entries(servers)) {
    const entry: AntigravityMcpServer = {};
    if (server.command) {
      entry.command = server.command;
      if (server.args && server.args.length > 0) entry.args = server.args;
      if (server.env && Object.keys(server.env).length > 0)
        entry.env = server.env;
    } else if (server.url) {
      entry.url = server.url;
      if (server.headers && Object.keys(server.headers).length > 0)
        entry.headers = server.headers;
    }
    result[name] = entry;
  }
  return result;
}
