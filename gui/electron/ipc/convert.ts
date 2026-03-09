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
        if (error) {
          reject({ stdout, stderr, error });
        } else {
          resolve({ stdout, stderr });
        }
      },
    );
  });
}

export function registerConvertHandlers() {
  ipcMain.handle(
    'convert:run',
    async (
      _e,
      opts: {
        source: string;
        targets: string[];
        output: string;
        agentMode: string;
        permissions: string;
      },
    ) => {
      const results: Array<{
        target: string;
        status: string;
        output: string;
        error?: string;
      }> = [];

      for (const target of opts.targets) {
        try {
          const args = [
            'convert',
            opts.source,
            '--to',
            target,
            '--output',
            opts.output,
            '--agent-mode',
            opts.agentMode,
            '--permissions',
            opts.permissions,
          ];
          const { stdout } = await runCli(args);
          results.push({ target, status: 'success', output: stdout });
        } catch (err: any) {
          results.push({
            target,
            status: 'error',
            output: '',
            error: err.stderr || err.message,
          });
        }
      }

      return results;
    },
  );
}
