import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, test } from 'vitest';
import type { ClaudeHomeConfig } from '../src/parsers/claude-home';
import { syncToAntigravity } from '../src/sync/antigravity';

describe('syncToAntigravity', () => {
  test('symlinks skills and writes settings.json', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'sync-antigravity-'),
    );
    const fixtureSkillDir = path.join(
      import.meta.dirname,
      'fixtures',
      'sample-plugin',
      'skills',
      'skill-one',
    );

    const config: ClaudeHomeConfig = {
      skills: [
        {
          name: 'skill-one',
          sourceDir: fixtureSkillDir,
          skillPath: path.join(fixtureSkillDir, 'SKILL.md'),
        },
      ],
      mcpServers: {
        context7: { url: 'https://mcp.context7.com/mcp' },
        local: { command: 'echo', args: ['hello'], env: { FOO: 'bar' } },
      },
    };

    await syncToAntigravity(config, tempRoot);

    // Check skill symlink
    const linkedSkillPath = path.join(
      tempRoot,
      '.gemini',
      'antigravity',
      'skills',
      'skill-one',
    );
    const linkedStat = await fs.lstat(linkedSkillPath);
    expect(linkedStat.isSymbolicLink()).toBe(true);

    // Check settings.json
    const settingsPath = path.join(
      tempRoot,
      '.gemini',
      'antigravity',
      'settings.json',
    );
    const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8')) as {
      mcpServers: Record<
        string,
        {
          url?: string;
          command?: string;
          args?: string[];
          env?: Record<string, string>;
        }
      >;
    };

    expect(settings.mcpServers.context7?.url).toBe(
      'https://mcp.context7.com/mcp',
    );
    expect(settings.mcpServers.local?.command).toBe('echo');
    expect(settings.mcpServers.local?.args).toEqual(['hello']);
    expect(settings.mcpServers.local?.env).toEqual({ FOO: 'bar' });
  });

  test('merges existing settings.json', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'sync-antigravity-merge-'),
    );
    const antigravityDir = path.join(tempRoot, '.gemini', 'antigravity');
    await fs.mkdir(antigravityDir, { recursive: true });
    const settingsPath = path.join(antigravityDir, 'settings.json');

    await fs.writeFile(
      settingsPath,
      JSON.stringify(
        {
          theme: 'dark',
          mcpServers: { existing: { command: 'node', args: ['server.js'] } },
        },
        null,
        2,
      ),
    );

    const config: ClaudeHomeConfig = {
      skills: [],
      mcpServers: {
        context7: { url: 'https://mcp.context7.com/mcp' },
      },
    };

    await syncToAntigravity(config, tempRoot);

    const merged = JSON.parse(await fs.readFile(settingsPath, 'utf8')) as {
      theme: string;
      mcpServers: Record<string, { command?: string; url?: string }>;
    };

    // Preserves existing settings
    expect(merged.theme).toBe('dark');
    // Preserves existing MCP servers
    expect(merged.mcpServers.existing?.command).toBe('node');
    // Adds new MCP servers
    expect(merged.mcpServers.context7?.url).toBe(
      'https://mcp.context7.com/mcp',
    );
  });

  test('writes personal commands as Antigravity workflows', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'sync-antigravity-cmd-'),
    );

    const config: ClaudeHomeConfig = {
      skills: [],
      commands: [
        {
          name: 'workflows:plan',
          description: 'Planning command',
          argumentHint: '[goal]',
          body: 'Plan the work carefully.',
          sourcePath: '/tmp/workflows/plan.md',
        },
      ],
      mcpServers: {},
    };

    await syncToAntigravity(config, tempRoot);

    const content = await fs.readFile(
      path.join(
        tempRoot,
        '.gemini',
        'antigravity',
        'workflows',
        'workflows/plan.md',
      ),
      'utf8',
    );
    expect(content).toContain('Planning command');
    expect(content).toContain('$input');
  });

  test('does not write settings.json when no MCP servers', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'sync-antigravity-nomcp-'),
    );
    const fixtureSkillDir = path.join(
      import.meta.dirname,
      'fixtures',
      'sample-plugin',
      'skills',
      'skill-one',
    );

    const config: ClaudeHomeConfig = {
      skills: [
        {
          name: 'skill-one',
          sourceDir: fixtureSkillDir,
          skillPath: path.join(fixtureSkillDir, 'SKILL.md'),
        },
      ],
      mcpServers: {},
    };

    await syncToAntigravity(config, tempRoot);

    // Skills should still be symlinked
    const linkedSkillPath = path.join(
      tempRoot,
      '.gemini',
      'antigravity',
      'skills',
      'skill-one',
    );
    const linkedStat = await fs.lstat(linkedSkillPath);
    expect(linkedStat.isSymbolicLink()).toBe(true);

    // But settings.json should not exist
    const settingsExists = await fs
      .access(path.join(tempRoot, '.gemini', 'antigravity', 'settings.json'))
      .then(() => true)
      .catch(() => false);
    expect(settingsExists).toBe(false);
  });
});
