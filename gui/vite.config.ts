import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron';

  const plugins: any[] = [react()];

  if (isElectron) {
    // Dynamic imports — handle ESM default exports
    const electronMod = require('vite-plugin-electron');
    const rendererMod = require('vite-plugin-electron-renderer');
    const electron = electronMod.default || electronMod;
    const renderer = rendererMod.default || rendererMod;

    plugins.push(
      electron([
        {
          entry: 'electron/main.ts',
          vite: { build: { outDir: 'dist-electron' } },
        },
        {
          entry: 'electron/preload.ts',
          onstart(args: any) {
            args.reload();
          },
          vite: { build: { outDir: 'dist-electron' } },
        },
      ]),
      renderer(),
    );
  } else {
    // Browser mode — serve real API endpoints backed by the CLI
    const apiPlugin = require('./vite-plugin-api').default;
    plugins.push(apiPlugin());
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
