import path from 'path';
import type { AntigravityBundle } from '../types/antigravity';
import {
  backupFile,
  copyDir,
  ensureDir,
  pathExists,
  readJson,
  writeJson,
  writeText,
} from '../utils/files';

export async function writeAntigravityBundle(
  outputRoot: string,
  bundle: AntigravityBundle,
): Promise<void> {
  const paths = resolveAntigravityPaths(outputRoot);
  await ensureDir(paths.antigravityDir);

  if (bundle.generatedSkills.length > 0) {
    for (const skill of bundle.generatedSkills) {
      await writeText(
        path.join(paths.skillsDir, skill.name, 'SKILL.md'),
        skill.content + '\n',
      );
    }
  }

  if (bundle.skillDirs.length > 0) {
    for (const skill of bundle.skillDirs) {
      await copyDir(skill.sourceDir, path.join(paths.skillsDir, skill.name));
    }
  }

  if (bundle.workflows.length > 0) {
    for (const workflow of bundle.workflows) {
      await writeText(
        path.join(paths.workflowsDir, `${workflow.name}.md`),
        workflow.content + '\n',
      );
    }
  }

  if (bundle.mcpServers && Object.keys(bundle.mcpServers).length > 0) {
    const settingsPath = path.join(paths.antigravityDir, 'settings.json');
    const backupPath = await backupFile(settingsPath);
    if (backupPath) {
      console.log(`Backed up existing settings.json to ${backupPath}`);
    }

    // Merge mcpServers into existing settings if present
    let existingSettings: Record<string, unknown> = {};
    if (await pathExists(settingsPath)) {
      try {
        existingSettings =
          await readJson<Record<string, unknown>>(settingsPath);
      } catch {
        console.warn(
          'Warning: existing settings.json could not be parsed and will be replaced.',
        );
      }
    }

    const existingMcp =
      existingSettings.mcpServers &&
      typeof existingSettings.mcpServers === 'object'
        ? (existingSettings.mcpServers as Record<string, unknown>)
        : {};
    const merged = {
      ...existingSettings,
      mcpServers: { ...existingMcp, ...bundle.mcpServers },
    };
    await writeJson(settingsPath, merged);
  }
}

function resolveAntigravityPaths(outputRoot: string) {
  const base = path.basename(outputRoot);
  // If already pointing at .gemini/antigravity, write directly into it
  if (base === 'antigravity') {
    return {
      antigravityDir: outputRoot,
      skillsDir: path.join(outputRoot, 'skills'),
      workflowsDir: path.join(outputRoot, 'workflows'),
    };
  }
  // If pointing at .gemini, nest under antigravity
  if (base === '.gemini') {
    return {
      antigravityDir: path.join(outputRoot, 'antigravity'),
      skillsDir: path.join(outputRoot, 'antigravity', 'skills'),
      workflowsDir: path.join(outputRoot, 'antigravity', 'workflows'),
    };
  }
  // Otherwise nest under .gemini/antigravity
  return {
    antigravityDir: path.join(outputRoot, '.gemini', 'antigravity'),
    skillsDir: path.join(outputRoot, '.gemini', 'antigravity', 'skills'),
    workflowsDir: path.join(outputRoot, '.gemini', 'antigravity', 'workflows'),
  };
}
