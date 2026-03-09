/**
 * Shared Electron test fixture.
 *
 * Launches the Electron app once per test, provides the `electronApp`
 * and the first `window` (Page) to every test, then closes cleanly.
 */
import {
  type ElectronApplication,
  type Page,
  test as base,
  _electron as electron,
} from '@playwright/test';
import path from 'path';

type ElectronFixtures = {
  electronApp: ElectronApplication;
  window: Page;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../dist-electron/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });
    await use(app);
    await app.close();
  },

  window: async ({ electronApp }, use) => {
    const win = await electronApp.firstWindow();
    await win.waitForLoadState('domcontentloaded');
    await use(win);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper: mock the directory dialog and open a project.
 * Call this before tests that need to be past the launcher.
 */
export async function openTestProject(
  electronApp: ElectronApplication,
  window: Page,
  projectPath = 'C:\\test-project',
) {
  // Mock Electron's dialog.showOpenDialog in the main process
  await electronApp.evaluate(async ({ dialog }, mockPath) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths: [mockPath],
    })) as any;
  }, projectPath);

  // Click Open Project
  await window.getByText('Open Project').click();

  // Wait for sidebar nav to appear (means we made it past the launcher)
  await window.locator('nav button').first().waitFor({ timeout: 5000 });
}
