import { execFile } from 'child_process';
import { ipcMain } from 'electron';
import path from 'path';

const CLI_ROOT = path.resolve(__dirname, '../../..');

function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      'npx',
      ['tsx', path.join(CLI_ROOT, 'src/index.ts'), ...args],
      { cwd: CLI_ROOT, shell: true },
      (error, stdout, stderr) => {
        if (error) reject({ stdout, stderr, error });
        else resolve({ stdout, stderr });
      },
    );
  });
}

export function registerSyncHandlers() {
  ipcMain.handle(
    'sync:run',
    async (
      _e,
      opts: {
        target: string;
        output?: string;
        claudeHome?: string;
      },
    ) => {
      try {
        const args = ['sync', '--target', opts.target];
        if (opts.output) args.push('--output', opts.output);
        if (opts.claudeHome) args.push('--claude-home', opts.claudeHome);

        const { stdout } = await runCli(args);
        return { status: 'success', output: stdout };
      } catch (err: any) {
        return {
          status: 'error',
          output: '',
          error: err.stderr || err.message,
        };
      }
    },
  );
}
