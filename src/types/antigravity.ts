export type AntigravitySkill = {
  name: string;
  content: string; // Full SKILL.md with YAML frontmatter
};

export type AntigravitySkillDir = {
  name: string;
  sourceDir: string;
};

export type AntigravityWorkflow = {
  name: string; // e.g. "plan" or "workflows/plan"
  content: string; // Full workflow .md content with frontmatter
};

export type AntigravityMcpServer = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
};

export type AntigravityBundle = {
  generatedSkills: AntigravitySkill[]; // From agents
  skillDirs: AntigravitySkillDir[]; // From skills (pass-through)
  workflows: AntigravityWorkflow[]; // From commands
  mcpServers?: Record<string, AntigravityMcpServer>;
};
