/**
 * Vite plugin that exposes CLI-backed API endpoints for browser mode.
 * In Electron, the renderer calls via IPC. In the browser, these
 * endpoints handle /api/convert, /api/sync, and /api/plugins.
 */
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

const CLI_ROOT = path.resolve(__dirname, '..');

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

async function listPlugins(projectPath: string) {
  const pluginsDir = path.join(projectPath, 'plugins');
  try {
    const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
    const plugins = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pluginJsonPath = path.join(
        pluginsDir,
        entry.name,
        '.claude-plugin',
        'plugin.json',
      );
      try {
        const raw = await fs.readFile(pluginJsonPath, 'utf8');
        const manifest = JSON.parse(raw);
        plugins.push({
          name: entry.name,
          displayName: manifest.name || entry.name,
          description: manifest.description || '',
          version: manifest.version || '0.0.0',
          path: path.join(pluginsDir, entry.name),
        });
      } catch {
        // Skip directories without valid plugin.json
      }
    }
    return plugins;
  } catch {
    return [];
  }
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: string) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export default function apiPlugin(): Plugin {
  return {
    name: 'nde-devtools-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        res.setHeader('Content-Type', 'application/json');

        try {
          // POST /api/convert
          if (req.url === '/api/convert' && req.method === 'POST') {
            const opts = await readBody(req);
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

            res.end(JSON.stringify(results));
            return;
          }

          // POST /api/sync
          if (req.url === '/api/sync' && req.method === 'POST') {
            const opts = await readBody(req);
            try {
              const args = ['sync', '--target', opts.target];
              if (opts.output) args.push('--output', opts.output);
              if (opts.claudeHome) args.push('--claude-home', opts.claudeHome);

              const { stdout } = await runCli(args);
              res.end(JSON.stringify({ status: 'success', output: stdout }));
            } catch (err: any) {
              res.end(
                JSON.stringify({
                  status: 'error',
                  output: '',
                  error: err.stderr || err.message,
                }),
              );
            }
            return;
          }

          // GET /api/plugins?project=<path>
          if (req.url?.startsWith('/api/plugins') && req.method === 'GET') {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const projectPath = url.searchParams.get('project') || CLI_ROOT;
            const plugins = await listPlugins(projectPath);
            res.end(JSON.stringify(plugins));
            return;
          }

          next();
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
