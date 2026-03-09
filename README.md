# Compound Marketplace

[![Build Status](https://github.com/EveryInc/compound-engineering-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/EveryInc/compound-engineering-plugin/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/@every-env/compound-plugin)](https://www.npmjs.com/package/@every-env/compound-plugin)

A Claude Code plugin marketplace featuring the **Compound Engineering Plugin** — tools that make each unit of engineering work easier than the last.

## Claude Code Install

```bash
/plugin marketplace add EveryInc/compound-engineering-plugin
/plugin install compound-engineering
```

## Cursor Install

```text
/add-plugin compound-engineering
```

## OpenCode, Codex, Droid, Pi, Gemini, Copilot, Kiro, Windsurf, OpenClaw, Qwen & Antigravity (experimental) Install

This repo includes a TypeScript CLI that converts Claude Code plugins to OpenCode, Codex, Factory Droid, Pi, Gemini CLI, GitHub Copilot, Kiro CLI, Windsurf, OpenClaw, Qwen Code, and Antigravity.

```bash
# convert the compound-engineering plugin into OpenCode format
pnpx @every-env/compound-plugin install compound-engineering --to opencode

# convert to Codex format
pnpx @every-env/compound-plugin install compound-engineering --to codex

# convert to Factory Droid format
pnpx @every-env/compound-plugin install compound-engineering --to droid

# convert to Pi format
pnpx @every-env/compound-plugin install compound-engineering --to pi

# convert to Gemini CLI format
pnpx @every-env/compound-plugin install compound-engineering --to gemini

# convert to GitHub Copilot format
pnpx @every-env/compound-plugin install compound-engineering --to copilot

# convert to Kiro CLI format
pnpx @every-env/compound-plugin install compound-engineering --to kiro

# convert to OpenClaw format
pnpx @every-env/compound-plugin install compound-engineering --to openclaw

# convert to Windsurf format (global scope by default)
pnpx @every-env/compound-plugin install compound-engineering --to windsurf

# convert to Windsurf workspace scope
pnpx @every-env/compound-plugin install compound-engineering --to windsurf --scope workspace

# convert to Qwen Code format
pnpx @every-env/compound-plugin install compound-engineering --to qwen

# convert to Antigravity format
pnpx @every-env/compound-plugin install compound-engineering --to antigravity

# auto-detect installed tools and install to all
pnpx @every-env/compound-plugin install compound-engineering --to all
```

Local dev:

```bash
pnpm tsx src/index.ts install ./plugins/compound-engineering --to opencode
```

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

## Sync Personal Config

Sync your personal Claude Code config (`~/.claude/`) to other AI coding tools. Omit `--target` to sync to all detected supported tools automatically:

```bash
# Sync to all detected tools (default)
pnpx @every-env/compound-plugin sync

# Sync skills and MCP servers to OpenCode
pnpx @every-env/compound-plugin sync --target opencode

# Sync to Codex
pnpx @every-env/compound-plugin sync --target codex

# Sync to Pi
pnpx @every-env/compound-plugin sync --target pi

# Sync to Droid
pnpx @every-env/compound-plugin sync --target droid

# Sync to GitHub Copilot (skills + MCP servers)
pnpx @every-env/compound-plugin sync --target copilot

# Sync to Gemini (skills + MCP servers)
pnpx @every-env/compound-plugin sync --target gemini

# Sync to Windsurf
pnpx @every-env/compound-plugin sync --target windsurf

# Sync to Kiro
pnpx @every-env/compound-plugin sync --target kiro

# Sync to Qwen
pnpx @every-env/compound-plugin sync --target qwen

# Sync to Antigravity
pnpx @every-env/compound-plugin sync --target antigravity

# Sync to OpenClaw (skills only; MCP is validation-gated)
pnpx @every-env/compound-plugin sync --target openclaw

# Sync to all detected tools
pnpx @every-env/compound-plugin sync --target all
```

This syncs:

- Personal skills from `~/.claude/skills/` (as symlinks)
- Personal slash commands from `~/.claude/commands/` (as provider-native prompts, workflows, or converted skills where supported)
- MCP servers from `~/.claude/settings.json`

Skills are symlinked (not copied) so changes in Claude Code are reflected immediately.

Supported sync targets:

- `opencode`
- `codex`
- `pi`
- `droid`
- `copilot`
- `gemini`
- `windsurf`
- `kiro`
- `qwen`
- `antigravity`
- `openclaw`

Notes:

- Codex sync preserves non-managed `config.toml` content and now includes remote MCP servers.
- Command sync reuses each provider's existing Claude command conversion, so some targets receive prompts or workflows while others receive converted skills.
- Copilot sync writes personal skills to `~/.copilot/skills/` and MCP config to `~/.copilot/mcp-config.json`.
- Gemini sync writes MCP config to `~/.gemini/` and avoids mirroring skills that Gemini already discovers from `~/.agents/skills`, which prevents duplicate-skill warnings.
- Droid, Windsurf, Kiro, and Qwen sync merge MCP servers into the provider's documented user config.
- Antigravity sync writes skills, workflows, and MCP config to `~/.gemini/antigravity/`. Commands are converted to workflow `.md` files with YAML frontmatter.
- OpenClaw currently syncs skills only. Personal command sync is skipped because this repo does not yet have a documented user-level OpenClaw command surface, and MCP sync is skipped because the current official OpenClaw docs do not clearly document an MCP server config contract.

## Workflow

```
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
- [Compound engineering: how Every codes with agents](https://every.to/chain-of-thought/compound-engineering-how-every-codes-with-agents)
- [The story behind compounding engineering](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it)
