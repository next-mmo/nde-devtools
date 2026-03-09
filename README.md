# NDE DevTools

A TypeScript CLI that converts Claude Code plugins into other AI coding tool formats.

## Setup

```bash
# Clone the repo
git clone https://github.com/user/next-mmo.git
cd next-mmo/nde-devtools

# Install dependencies
pnpm install
```

## Usage

All commands use `pnpm tsx src/index.ts` as the entry point.

### Install a Plugin

Convert a Claude Code plugin to a target format:

```bash
# convert to OpenCode format
pnpm tsx src/index.ts install compound-engineering --to opencode

# convert to Codex format
pnpm tsx src/index.ts install compound-engineering --to codex

# convert to Factory Droid format
pnpm tsx src/index.ts install compound-engineering --to droid

# convert to Pi format
pnpm tsx src/index.ts install compound-engineering --to pi

# convert to Gemini CLI format
pnpm tsx src/index.ts install compound-engineering --to gemini

# convert to GitHub Copilot format
pnpm tsx src/index.ts install compound-engineering --to copilot

# convert to Kiro CLI format
pnpm tsx src/index.ts install compound-engineering --to kiro

# convert to OpenClaw format
pnpm tsx src/index.ts install compound-engineering --to openclaw

# convert to Windsurf format (global scope by default)
pnpm tsx src/index.ts install compound-engineering --to windsurf

# convert to Windsurf workspace scope
pnpm tsx src/index.ts install compound-engineering --to windsurf --scope workspace

# convert to Qwen Code format
pnpm tsx src/index.ts install compound-engineering --to qwen

# convert to Antigravity format
pnpm tsx src/index.ts install compound-engineering --to antigravity

# auto-detect installed tools and install to all
pnpm tsx src/index.ts install compound-engineering --to all
```

### Convert a Local Plugin

```bash
pnpm tsx src/index.ts convert ./plugins/compound-engineering --to opencode
```

### Sync Personal Config

Sync your personal Claude Code config (`~/.claude/`) to other AI coding tools:

```bash
# Sync to all detected tools (default, writes to global home)
pnpm tsx src/index.ts sync

# Sync to a specific target
pnpm tsx src/index.ts sync --target opencode
pnpm tsx src/index.ts sync --target codex
pnpm tsx src/index.ts sync --target pi
pnpm tsx src/index.ts sync --target droid
pnpm tsx src/index.ts sync --target copilot
pnpm tsx src/index.ts sync --target gemini
pnpm tsx src/index.ts sync --target windsurf
pnpm tsx src/index.ts sync --target kiro
pnpm tsx src/index.ts sync --target qwen
pnpm tsx src/index.ts sync --target antigravity
pnpm tsx src/index.ts sync --target openclaw

# Sync to all detected tools
pnpm tsx src/index.ts sync --target all

# Sync to a local project directory instead of global home
pnpm tsx src/index.ts sync --target antigravity --output .
pnpm tsx src/index.ts sync --target gemini --output ~/my-project
pnpm tsx src/index.ts sync --target all -o .
```

This syncs:

- Personal skills from `~/.claude/skills/` (as symlinks)
- Personal slash commands from `~/.claude/commands/` (as provider-native prompts, workflows, or converted skills where supported)
- MCP servers from `~/.claude/settings.json`

Skills are symlinked (not copied) so changes in Claude Code are reflected immediately.

By default, sync writes to the global home directory for each target. Use `--output` / `-o` to write to a local project directory instead.

When writing to a local project, the tool automatically adds the output directory (e.g. `.gemini/antigravity/`, `.kiro/`) to the project's `.gitignore` so generated files aren't accidentally committed.

### List Plugins

```bash
pnpm tsx src/index.ts list
```

## Supported Targets

<details>
<summary>Output format details per target</summary>

| Target | Output path | Notes |
| --- | --- | --- |
| `opencode` | `~/.config/opencode/` | Commands as `.md` files; `opencode.json` MCP config deep-merged; backups made before overwriting |
| `codex` | `~/.codex/prompts` + `~/.codex/skills` | Each command becomes a prompt + skill pair; descriptions truncated to 1024 chars |
| `droid` | `~/.factory/` | Tool names mapped (`Bash`→`Execute`, `Write`→`Create`); namespace prefixes stripped |
| `pi` | `~/.pi/agent/` | Prompts, skills, extensions, and `mcporter.json` for MCPorter interoperability |
| `gemini` | `.gemini/` | Skills from agents; commands as `.toml`; namespaced commands become directories (`workflows:plan` → `commands/workflows/plan.toml`) |
| `copilot` | `.github/` | Agents as `.agent.md` with Copilot frontmatter; MCP env vars prefixed with `COPILOT_MCP_` |
| `kiro` | `.kiro/` | Agents as JSON configs + prompt `.md` files; only stdio MCP servers supported |
| `openclaw` | `~/.openclaw/extensions/<plugin>/` | Entry-point TypeScript skill file; `openclaw-extension.json` for MCP servers |
| `windsurf` | `~/.codeium/windsurf/` (global) or `.windsurf/` (workspace) | Agents become skills; commands become flat workflows; `mcp_config.json` merged |
| `qwen` | `~/.qwen/extensions/<plugin>/` | Agents as `.yaml`; env vars with placeholders extracted as settings; colon separator for nested commands |
| `antigravity` | `.gemini/antigravity/` | Skills from agents; commands as workflow `.md`; `settings.json` MCP config deep-merged |

All provider targets are experimental and may change as the formats evolve.

</details>

## Sync Target Notes

- Codex sync preserves non-managed `config.toml` content and now includes remote MCP servers.
- Command sync reuses each provider's existing Claude command conversion, so some targets receive prompts or workflows while others receive converted skills.
- Copilot sync writes personal skills to `~/.copilot/skills/` and MCP config to `~/.copilot/mcp-config.json`.
- Gemini sync writes MCP config to `~/.gemini/` and avoids mirroring skills that Gemini already discovers from `~/.agents/skills`, which prevents duplicate-skill warnings.
- Droid, Windsurf, Kiro, and Qwen sync merge MCP servers into the provider's documented user config.
- Antigravity sync writes skills, workflows, and MCP config to `~/.gemini/antigravity/`. Commands are converted to workflow `.md` files with YAML frontmatter.
- OpenClaw currently syncs skills only. Personal command sync is skipped because this repo does not yet have a documented user-level OpenClaw command surface, and MCP sync is skipped because the current official OpenClaw docs do not clearly document an MCP server config contract.

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Workflow

```text
Plan → Work → Review → Compound → Repeat
```

| Command        | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| `/ce:plan`     | Turn feature ideas into detailed implementation plans |
| `/ce:work`     | Execute plans with worktrees and task tracking        |
| `/ce:review`   | Multi-agent code review before merging                |
| `/ce:compound` | Document learnings to make future work easier         |

Each cycle compounds: plans inform future plans, reviews catch more issues, patterns get documented.

## Philosophy

**Each unit of engineering work should make subsequent units easier—not harder.**

Traditional development accumulates technical debt. Every feature adds complexity. The codebase becomes harder to work with over time.

Compound engineering inverts this. 80% is in planning and review, 20% is in execution:

- Plan thoroughly before writing code
- Review to catch issues and capture learnings
- Codify knowledge so it's reusable
- Keep quality high so future changes are easy

## Learn More

- [Full component reference](plugins/compound-engineering/README.md) - all agents, commands, skills
