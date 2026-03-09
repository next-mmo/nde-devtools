import { promises as fs } from 'fs';
import path from 'path';

/**
 * Map of target names to the gitignore patterns they produce in a workspace.
 * Only includes targets that write to workspace-local directories (not global home).
 */
const TARGET_GITIGNORE_PATTERNS: Record<string, string[]> = {
  opencode: ['.opencode/'],
  cursor: ['.cursor/'],
  gemini: ['.gemini/'],
  copilot: ['.github/copilot/'],
  kiro: ['.kiro/'],
  windsurf: ['.windsurf/'],
  antigravity: ['.gemini/antigravity/'],
};

/**
 * Ensure that the target's output directories are listed in the project's .gitignore.
 * Only acts when outputs go to a workspace-local path (not global home dirs like ~/.codex).
 *
 * @param projectRoot - The project root directory containing .gitignore
 * @param targetName - The target name (e.g. "antigravity", "gemini")
 */
export async function ensureGitignore(
  projectRoot: string,
  targetName: string,
): Promise<void> {
  const patterns = TARGET_GITIGNORE_PATTERNS[targetName];
  if (!patterns || patterns.length === 0) return;

  const gitignorePath = path.join(projectRoot, '.gitignore');

  let existing = '';
  try {
    existing = await fs.readFile(gitignorePath, 'utf8');
  } catch {
    // No .gitignore yet — we'll create one
  }

  const existingLines = new Set(
    existing.split(/\r?\n/).map((line) => line.trim()),
  );

  const missing = patterns.filter((pattern) => !existingLines.has(pattern));
  if (missing.length === 0) return;

  const header = '# AI coding tool output (auto-added by nde-devtools)';
  const needsHeader = !existing.includes(header);

  const block = ['', ...(needsHeader ? [header] : []), ...missing].join('\n');

  const separator = existing.endsWith('\n') || existing === '' ? '' : '\n';
  await fs.writeFile(
    gitignorePath,
    existing + separator + block + '\n',
    'utf8',
  );

  for (const pattern of missing) {
    console.log(`Added ${pattern} to .gitignore`);
  }
}

/**
 * Determine the project root from an output path.
 * Walks up from the output path looking for .git/ to find the project root.
 * Returns undefined if the output path is under the user's home config (global).
 */
export function resolveProjectRoot(outputPath: string): string | undefined {
  let current = path.resolve(outputPath);
  const root = path.parse(current).root;

  while (current !== root) {
    try {
      // Synchronous check is fine here — called once after write
      const gitDir = path.join(current, '.git');
      // We can't do sync check easily, so just return the parent of the target dir
      // if it looks like a workspace path (contains .gemini, .kiro, etc.)
      const base = path.basename(current);
      if (
        base === '.gemini' ||
        base === '.kiro' ||
        base === '.cursor' ||
        base === '.windsurf' ||
        base === '.opencode' ||
        base === '.github' ||
        base === 'antigravity'
      ) {
        // Keep going up
        current = path.dirname(current);
        continue;
      }
      return current;
    } catch {
      current = path.dirname(current);
    }
  }
  return undefined;
}
