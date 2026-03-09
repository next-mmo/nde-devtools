import type {
  AntigravityBundle,
  AntigravityMcpServer,
  AntigravitySkill,
  AntigravityWorkflow,
} from '../types/antigravity';
import type {
  ClaudeAgent,
  ClaudeCommand,
  ClaudeMcpServer,
  ClaudePlugin,
} from '../types/claude';
import { formatFrontmatter } from '../utils/frontmatter';
import type { ClaudeToOpenCodeOptions } from './claude-to-opencode';

export type ClaudeToAntigravityOptions = ClaudeToOpenCodeOptions;

const ANTIGRAVITY_DESCRIPTION_MAX_LENGTH = 1024;

export function convertClaudeToAntigravity(
  plugin: ClaudePlugin,
  _options: ClaudeToAntigravityOptions,
): AntigravityBundle {
  const usedSkillNames = new Set<string>();
  const usedWorkflowNames = new Set<string>();

  const skillDirs = plugin.skills.map((skill) => ({
    name: skill.name,
    sourceDir: skill.sourceDir,
  }));

  // Reserve skill names from pass-through skills
  for (const skill of skillDirs) {
    usedSkillNames.add(normalizeName(skill.name));
  }

  const generatedSkills = plugin.agents.map((agent) =>
    convertAgentToSkill(agent, usedSkillNames),
  );

  const workflows = plugin.commands.map((command) =>
    convertCommandToWorkflow(command, usedWorkflowNames),
  );

  const mcpServers = convertMcpServers(plugin.mcpServers);

  if (plugin.hooks && Object.keys(plugin.hooks.hooks).length > 0) {
    console.warn(
      'Warning: Antigravity does not support hooks directly. Hooks were skipped during conversion.',
    );
  }

  return { generatedSkills, skillDirs, workflows, mcpServers };
}

function convertAgentToSkill(
  agent: ClaudeAgent,
  usedNames: Set<string>,
): AntigravitySkill {
  const name = uniqueName(normalizeName(agent.name), usedNames);
  const description = sanitizeDescription(
    agent.description ?? `Use this skill for ${agent.name} tasks`,
  );

  const frontmatter: Record<string, unknown> = { name, description };

  let body = transformContentForAntigravity(agent.body.trim());
  if (agent.capabilities && agent.capabilities.length > 0) {
    const capabilities = agent.capabilities.map((c) => `- ${c}`).join('\n');
    body = `## Capabilities\n${capabilities}\n\n${body}`.trim();
  }
  if (body.length === 0) {
    body = `Instructions converted from the ${agent.name} agent.`;
  }

  const content = formatFrontmatter(frontmatter, body);
  return { name, content };
}

function convertCommandToWorkflow(
  command: ClaudeCommand,
  usedNames: Set<string>,
): AntigravityWorkflow {
  // Preserve namespace structure: workflows:plan -> workflows/plan
  const workflowPath = resolveWorkflowPath(command.name);
  const pathKey = workflowPath.join('/');
  uniqueName(pathKey, usedNames);

  const description =
    command.description ?? `Converted from Claude command ${command.name}`;
  const transformedBody = transformContentForAntigravity(command.body.trim());

  let body = transformedBody;
  if (command.argumentHint) {
    body += `\n\nUser request: $input`;
  }

  const frontmatter: Record<string, unknown> = { description };

  const content = formatFrontmatter(frontmatter, body);
  return { name: pathKey, content };
}

/**
 * Transform Claude Code content to Antigravity-compatible content.
 *
 * 1. Task agent calls: Task agent-name(args) -> Use the agent-name skill to: args
 * 2. Path rewriting: .claude/ -> .gemini/antigravity/, ~/.claude/ -> ~/.gemini/antigravity/
 * 3. Agent references: @agent-name -> the agent-name skill
 */
export function transformContentForAntigravity(body: string): string {
  let result = body;

  // 1. Transform Task agent calls
  const taskPattern = /^(\s*-?\s*)Task\s+([a-z][a-z0-9-]*)\(([^)]+)\)/gm;
  result = result.replace(
    taskPattern,
    (_match, prefix: string, agentName: string, args: string) => {
      const skillName = normalizeName(agentName);
      return `${prefix}Use the ${skillName} skill to: ${args.trim()}`;
    },
  );

  // 2. Rewrite .claude/ paths to .gemini/antigravity/
  result = result
    .replace(/~\/\.claude\//g, '~/.gemini/antigravity/')
    .replace(/\.claude\//g, '.gemini/antigravity/');

  // 3. Transform @agent-name references
  const agentRefPattern =
    /@([a-z][a-z0-9-]*-(?:agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist))/gi;
  result = result.replace(agentRefPattern, (_match, agentName: string) => {
    return `the ${normalizeName(agentName)} skill`;
  });

  return result;
}

function convertMcpServers(
  servers?: Record<string, ClaudeMcpServer>,
): Record<string, AntigravityMcpServer> | undefined {
  if (!servers || Object.keys(servers).length === 0) return undefined;

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

/**
 * Resolve command name to path segments.
 * workflows:plan -> ["workflows", "plan"]
 * plan -> ["plan"]
 */
function resolveWorkflowPath(name: string): string[] {
  return name.split(':').map((segment) => normalizeName(segment));
}

function normalizeName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'item';
  const normalized = trimmed
    .toLowerCase()
    .replace(/[\\/]+/g, '-')
    .replace(/[:\s]+/g, '-')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'item';
}

function sanitizeDescription(
  value: string,
  maxLength = ANTIGRAVITY_DESCRIPTION_MAX_LENGTH,
): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const ellipsis = '...';
  return (
    normalized.slice(0, Math.max(0, maxLength - ellipsis.length)).trimEnd() +
    ellipsis
  );
}

function uniqueName(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let index = 2;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  const name = `${base}-${index}`;
  used.add(name);
  return name;
}
