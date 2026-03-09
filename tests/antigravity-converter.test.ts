import { describe, expect, test } from 'vitest';
import {
  convertClaudeToAntigravity,
  transformContentForAntigravity,
} from '../src/converters/claude-to-antigravity';
import type { ClaudePlugin } from '../src/types/claude';
import { parseFrontmatter } from '../src/utils/frontmatter';

const fixturePlugin: ClaudePlugin = {
  root: '/tmp/plugin',
  manifest: { name: 'fixture', version: '1.0.0' },
  agents: [
    {
      name: 'Security Reviewer',
      description: 'Security-focused agent',
      capabilities: ['Threat modeling', 'OWASP'],
      model: 'claude-sonnet-4-20250514',
      body: 'Focus on vulnerabilities.',
      sourcePath: '/tmp/plugin/agents/security-reviewer.md',
    },
  ],
  commands: [
    {
      name: 'workflows:plan',
      description: 'Planning command',
      argumentHint: '[FOCUS]',
      model: 'inherit',
      allowedTools: ['Read'],
      body: 'Plan the work.',
      sourcePath: '/tmp/plugin/commands/workflows/plan.md',
    },
  ],
  skills: [
    {
      name: 'existing-skill',
      description: 'Existing skill',
      sourceDir: '/tmp/plugin/skills/existing-skill',
      skillPath: '/tmp/plugin/skills/existing-skill/SKILL.md',
    },
  ],
  hooks: undefined,
  mcpServers: {
    local: { command: 'echo', args: ['hello'] },
  },
};

describe('convertClaudeToAntigravity', () => {
  test('converts agents to skills with SKILL.md frontmatter', () => {
    const bundle = convertClaudeToAntigravity(fixturePlugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    const skill = bundle.generatedSkills.find(
      (s) => s.name === 'security-reviewer',
    );
    expect(skill).toBeDefined();
    const parsed = parseFrontmatter(skill!.content);
    expect(parsed.data.name).toBe('security-reviewer');
    expect(parsed.data.description).toBe('Security-focused agent');
    expect(parsed.body).toContain('Focus on vulnerabilities.');
  });

  test('agent with capabilities prepended to body', () => {
    const bundle = convertClaudeToAntigravity(fixturePlugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    const skill = bundle.generatedSkills.find(
      (s) => s.name === 'security-reviewer',
    );
    expect(skill).toBeDefined();
    const parsed = parseFrontmatter(skill!.content);
    expect(parsed.body).toContain('## Capabilities');
    expect(parsed.body).toContain('- Threat modeling');
    expect(parsed.body).toContain('- OWASP');
  });

  test('agent with empty description gets default description', () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [
        {
          name: 'my-agent',
          body: 'Do things.',
          sourcePath: '/tmp/plugin/agents/my-agent.md',
        },
      ],
      commands: [],
      skills: [],
    };

    const bundle = convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    const parsed = parseFrontmatter(bundle.generatedSkills[0].content);
    expect(parsed.data.description).toBe('Use this skill for my-agent tasks');
  });

  test('agent with empty body gets default body text', () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [
        {
          name: 'Empty Agent',
          description: 'An empty agent',
          body: '',
          sourcePath: '/tmp/plugin/agents/empty.md',
        },
      ],
      commands: [],
      skills: [],
    };

    const bundle = convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    const parsed = parseFrontmatter(bundle.generatedSkills[0].content);
    expect(parsed.body).toContain(
      'Instructions converted from the Empty Agent agent.',
    );
  });

  test('converts commands to workflows with frontmatter', () => {
    const bundle = convertClaudeToAntigravity(fixturePlugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.workflows).toHaveLength(1);
    const workflow = bundle.workflows[0];
    expect(workflow.name).toBe('workflows/plan');
    const parsed = parseFrontmatter(workflow.content);
    expect(parsed.data.description).toBe('Planning command');
    expect(parsed.body).toContain('Plan the work.');
  });

  test('command with argument-hint gets $input placeholder', () => {
    const bundle = convertClaudeToAntigravity(fixturePlugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    const workflow = bundle.workflows[0];
    expect(workflow.content).toContain('$input');
  });

  test('skills pass through as directory references', () => {
    const bundle = convertClaudeToAntigravity(fixturePlugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.skillDirs).toHaveLength(1);
    expect(bundle.skillDirs[0].name).toBe('existing-skill');
    expect(bundle.skillDirs[0].sourceDir).toBe(
      '/tmp/plugin/skills/existing-skill',
    );
  });

  test('MCP servers convert to settings.json-compatible config', () => {
    const bundle = convertClaudeToAntigravity(fixturePlugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.mcpServers?.local?.command).toBe('echo');
    expect(bundle.mcpServers?.local?.args).toEqual(['hello']);
  });

  test('plugin with zero agents produces empty generatedSkills', () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [],
      commands: [],
      skills: [],
    };

    const bundle = convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.generatedSkills).toHaveLength(0);
  });

  test('agent name colliding with skill name gets deduplicated', () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      skills: [
        {
          name: 'security-reviewer',
          description: 'Existing skill',
          sourceDir: '/tmp/skill',
          skillPath: '/tmp/skill/SKILL.md',
        },
      ],
      agents: [
        {
          name: 'Security Reviewer',
          description: 'Agent version',
          body: 'Body.',
          sourcePath: '/tmp/agents/sr.md',
        },
      ],
      commands: [],
    };

    const bundle = convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.generatedSkills[0].name).toBe('security-reviewer-2');
    expect(bundle.skillDirs[0].name).toBe('security-reviewer');
  });

  test('hooks present emits console.warn', () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (msg: string) => warnings.push(msg);

    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      hooks: { hooks: { PreToolUse: [{ matcher: '*', body: 'hook body' }] } },
      agents: [],
      commands: [],
      skills: [],
    };

    convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    console.warn = originalWarn;
    expect(warnings.some((w) => w.includes('Antigravity'))).toBe(true);
  });

  test('MCP servers with URL type are converted', () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [],
      commands: [],
      skills: [],
      mcpServers: {
        remote: {
          url: 'https://example.com/mcp',
          headers: { Authorization: 'Bearer token' },
        },
      },
    };

    const bundle = convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.mcpServers?.remote?.url).toBe('https://example.com/mcp');
    expect(bundle.mcpServers?.remote?.headers?.Authorization).toBe(
      'Bearer token',
    );
  });

  test('no MCP servers returns undefined mcpServers', () => {
    const plugin: ClaudePlugin = {
      ...fixturePlugin,
      agents: [],
      commands: [],
      skills: [],
      mcpServers: undefined,
    };

    const bundle = convertClaudeToAntigravity(plugin, {
      agentMode: 'subagent',
      inferTemperature: false,
      permissions: 'none',
    });

    expect(bundle.mcpServers).toBeUndefined();
  });
});

describe('transformContentForAntigravity', () => {
  test('transforms .claude/ paths to .gemini/antigravity/', () => {
    const result = transformContentForAntigravity(
      'Read .claude/settings.json for config.',
    );
    expect(result).toContain('.gemini/antigravity/settings.json');
    expect(result).not.toContain('.claude/');
  });

  test('transforms ~/.claude/ paths to ~/.gemini/antigravity/', () => {
    const result = transformContentForAntigravity(
      'Check ~/.claude/config for settings.',
    );
    expect(result).toContain('~/.gemini/antigravity/config');
    expect(result).not.toContain('~/.claude/');
  });

  test('transforms Task agent(args) to natural language skill reference', () => {
    const input = `Run these:

- Task repo-research-analyst(feature_description)
- Task learnings-researcher(feature_description)

Task best-practices-researcher(topic)`;

    const result = transformContentForAntigravity(input);
    expect(result).toContain(
      'Use the repo-research-analyst skill to: feature_description',
    );
    expect(result).toContain(
      'Use the learnings-researcher skill to: feature_description',
    );
    expect(result).toContain(
      'Use the best-practices-researcher skill to: topic',
    );
    expect(result).not.toContain('Task repo-research-analyst');
  });

  test('transforms @agent references to skill references', () => {
    const result = transformContentForAntigravity(
      'Ask @security-sentinel for a review.',
    );
    expect(result).toContain('the security-sentinel skill');
    expect(result).not.toContain('@security-sentinel');
  });
});
