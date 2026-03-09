import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { writeAntigravityBundle } from '../src/targets/antigravity';
import type { AntigravityBundle } from '../src/types/antigravity';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe('writeAntigravityBundle', () => {
  test('writes skills, workflows, and settings.json', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-test-'),
    );
    const bundle: AntigravityBundle = {
      generatedSkills: [
        {
          name: 'security-reviewer',
          content:
            '---\nname: security-reviewer\ndescription: Security\n---\n\nReview code.',
        },
      ],
      skillDirs: [
        {
          name: 'skill-one',
          sourceDir: path.join(
            import.meta.dirname,
            'fixtures',
            'sample-plugin',
            'skills',
            'skill-one',
          ),
        },
      ],
      workflows: [
        {
          name: 'plan',
          content:
            '---\ndescription: Plan the work\n---\n\nPlan the work carefully.',
        },
      ],
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['-y', '@anthropic/mcp-playwright'],
        },
      },
    };

    await writeAntigravityBundle(tempRoot, bundle);

    expect(
      await exists(
        path.join(
          tempRoot,
          '.gemini',
          'antigravity',
          'skills',
          'security-reviewer',
          'SKILL.md',
        ),
      ),
    ).toBe(true);
    expect(
      await exists(
        path.join(
          tempRoot,
          '.gemini',
          'antigravity',
          'skills',
          'skill-one',
          'SKILL.md',
        ),
      ),
    ).toBe(true);
    expect(
      await exists(
        path.join(tempRoot, '.gemini', 'antigravity', 'workflows', 'plan.md'),
      ),
    ).toBe(true);
    expect(
      await exists(
        path.join(tempRoot, '.gemini', 'antigravity', 'settings.json'),
      ),
    ).toBe(true);

    const skillContent = await fs.readFile(
      path.join(
        tempRoot,
        '.gemini',
        'antigravity',
        'skills',
        'security-reviewer',
        'SKILL.md',
      ),
      'utf8',
    );
    expect(skillContent).toContain('Review code.');

    const workflowContent = await fs.readFile(
      path.join(tempRoot, '.gemini', 'antigravity', 'workflows', 'plan.md'),
      'utf8',
    );
    expect(workflowContent).toContain('Plan the work carefully.');

    const settingsContent = JSON.parse(
      await fs.readFile(
        path.join(tempRoot, '.gemini', 'antigravity', 'settings.json'),
        'utf8',
      ),
    );
    expect(settingsContent.mcpServers.playwright.command).toBe('npx');
  });

  test('does not double-nest when output root is .gemini/antigravity', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-home-'),
    );
    const antigravityRoot = path.join(tempRoot, '.gemini', 'antigravity');
    const bundle: AntigravityBundle = {
      generatedSkills: [
        { name: 'reviewer', content: 'Reviewer skill content' },
      ],
      skillDirs: [],
      workflows: [{ name: 'plan', content: 'Plan content' }],
    };

    await writeAntigravityBundle(antigravityRoot, bundle);

    expect(
      await exists(
        path.join(antigravityRoot, 'skills', 'reviewer', 'SKILL.md'),
      ),
    ).toBe(true);
    expect(
      await exists(path.join(antigravityRoot, 'workflows', 'plan.md')),
    ).toBe(true);
    // Should NOT double-nest under antigravity/antigravity
    expect(await exists(path.join(antigravityRoot, 'antigravity'))).toBe(false);
    expect(await exists(path.join(antigravityRoot, '.gemini'))).toBe(false);
  });

  test('does not double-nest when output root is .gemini', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-gemini-'),
    );
    const geminiRoot = path.join(tempRoot, '.gemini');
    const bundle: AntigravityBundle = {
      generatedSkills: [
        { name: 'reviewer', content: 'Reviewer skill content' },
      ],
      skillDirs: [],
      workflows: [],
    };

    await writeAntigravityBundle(geminiRoot, bundle);

    expect(
      await exists(
        path.join(geminiRoot, 'antigravity', 'skills', 'reviewer', 'SKILL.md'),
      ),
    ).toBe(true);
    // Should NOT nest under .gemini/.gemini
    expect(await exists(path.join(geminiRoot, '.gemini'))).toBe(false);
  });

  test('handles empty bundles gracefully', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-empty-'),
    );
    const bundle: AntigravityBundle = {
      generatedSkills: [],
      skillDirs: [],
      workflows: [],
    };

    await writeAntigravityBundle(tempRoot, bundle);
    expect(await exists(tempRoot)).toBe(true);
  });

  test('backs up existing settings.json before overwrite', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-backup-'),
    );
    const antigravityRoot = path.join(tempRoot, '.gemini', 'antigravity');
    await fs.mkdir(antigravityRoot, { recursive: true });

    // Write existing settings.json
    const settingsPath = path.join(antigravityRoot, 'settings.json');
    await fs.writeFile(
      settingsPath,
      JSON.stringify({ mcpServers: { old: { command: 'old-cmd' } } }),
    );

    const bundle: AntigravityBundle = {
      generatedSkills: [],
      skillDirs: [],
      workflows: [],
      mcpServers: {
        newServer: { command: 'new-cmd' },
      },
    };

    await writeAntigravityBundle(antigravityRoot, bundle);

    // New settings.json should have the new content
    const newContent = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    expect(newContent.mcpServers.newServer.command).toBe('new-cmd');

    // A backup file should exist
    const files = await fs.readdir(antigravityRoot);
    const backupFiles = files.filter((f) => f.startsWith('settings.json.bak.'));
    expect(backupFiles.length).toBeGreaterThanOrEqual(1);
  });

  test('merges mcpServers into existing settings.json without clobbering other keys', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-merge-'),
    );
    const antigravityRoot = path.join(tempRoot, '.gemini', 'antigravity');
    await fs.mkdir(antigravityRoot, { recursive: true });

    // Write existing settings.json with other keys
    const settingsPath = path.join(antigravityRoot, 'settings.json');
    await fs.writeFile(
      settingsPath,
      JSON.stringify({
        model: 'gemini-2.5-pro',
        mcpServers: { old: { command: 'old-cmd' } },
      }),
    );

    const bundle: AntigravityBundle = {
      generatedSkills: [],
      skillDirs: [],
      workflows: [],
      mcpServers: {
        newServer: { command: 'new-cmd' },
      },
    };

    await writeAntigravityBundle(antigravityRoot, bundle);

    const content = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    // Should preserve existing model key
    expect(content.model).toBe('gemini-2.5-pro');
    // Should preserve existing MCP server
    expect(content.mcpServers.old.command).toBe('old-cmd');
    // Should add new MCP server
    expect(content.mcpServers.newServer.command).toBe('new-cmd');
  });

  test('namespaced workflows create subdirectories', async () => {
    const tempRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'antigravity-ns-'),
    );
    const bundle: AntigravityBundle = {
      generatedSkills: [],
      skillDirs: [],
      workflows: [
        {
          name: 'workflows/plan',
          content: '---\ndescription: Plan\n---\n\nPlan.',
        },
      ],
    };

    await writeAntigravityBundle(tempRoot, bundle);

    expect(
      await exists(
        path.join(
          tempRoot,
          '.gemini',
          'antigravity',
          'workflows',
          'workflows',
          'plan.md',
        ),
      ),
    ).toBe(true);
  });
});
