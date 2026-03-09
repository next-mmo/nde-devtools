import { expect, openTestProject, test } from './fixtures';

// ─── App Launch ──────────────────────────────────────────────

test.describe('App Launch', () => {
  test('window opens with correct title', async ({ window }) => {
    const title = await window.title();
    expect(title).toContain('NDE DevTools');
  });

  test('shows Project Launcher on startup', async ({ window }) => {
    await expect(window.getByRole('heading', { name: /NDE/i })).toBeVisible();
    await expect(window.getByText('Open Project')).toBeVisible();
  });

  test('is not packaged in dev mode', async ({ electronApp }) => {
    const isPackaged = await electronApp.evaluate(({ app }) => app.isPackaged);
    expect(isPackaged).toBe(false);
  });
});

// ─── Project Launcher ────────────────────────────────────────

test.describe('Project Launcher', () => {
  test('can open a project via the launcher', async ({
    electronApp,
    window,
  }) => {
    await openTestProject(electronApp, window, 'C:\\test-project');

    // Sidebar should show the project name (scoped to complementary/aside)
    const sidebar = window.locator('aside');
    await expect(
      sidebar.getByText('test-project', { exact: true }),
    ).toBeVisible();
    // Navigation should be visible
    await expect(
      window.locator('nav button', { hasText: 'Dashboard' }),
    ).toBeVisible();
  });

  test('stores recent projects and shows them', async ({
    electronApp,
    window,
  }) => {
    await openTestProject(electronApp, window, 'C:\\my-plugin');

    // Go back to launcher
    await window.getByText('Switch Project').click();

    // Recent projects should show the project we opened
    await expect(
      window.getByText('my-plugin', { exact: true }).first(),
    ).toBeVisible();
  });

  test('canceled dialog does not open project', async ({
    electronApp,
    window,
  }) => {
    await electronApp.evaluate(async ({ dialog }) => {
      dialog.showOpenDialog = (async () => ({
        canceled: true,
        filePaths: [],
      })) as any;
    });

    await window.getByText('Open Project').click();

    // Should still be on the launcher
    await expect(window.getByText('Open Project')).toBeVisible();
  });
});

// ─── Navigation ──────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ electronApp, window }) => {
    await openTestProject(electronApp, window);
  });

  test('sidebar shows all navigation items', async ({ window }) => {
    const labels = ['Dashboard', 'Convert', 'Sync', 'History', 'Settings'];
    for (const label of labels) {
      await expect(
        window.locator('nav button', { hasText: label }),
      ).toBeVisible();
    }
  });

  test('can navigate to each page', async ({ window }) => {
    const main = window.locator('main');

    // Navigate to Convert
    await window.locator('nav button', { hasText: 'Convert' }).click();
    await expect(main.getByText('Convert Plugin')).toBeVisible();

    // Navigate to Sync
    await window.locator('nav button', { hasText: 'Sync' }).click();
    await expect(main.getByText('Sync Config')).toBeVisible();

    // Navigate to Settings
    await window.locator('nav button', { hasText: 'Settings' }).click();
    await expect(main.locator('h2', { hasText: 'Settings' })).toBeVisible();

    // Navigate to History
    await window.locator('nav button', { hasText: 'History' }).click();
    await expect(main.locator('h2', { hasText: 'History' })).toBeVisible();

    // Back to Dashboard
    await window.locator('nav button', { hasText: 'Dashboard' }).click();
    await expect(main.getByText('Welcome to NDE DevTools')).toBeVisible();
  });
});

// ─── Sync Page ───────────────────────────────────────────────

test.describe('Sync Page', () => {
  test.beforeEach(async ({ electronApp, window }) => {
    await openTestProject(electronApp, window);
    await window.locator('nav button', { hasText: 'Sync' }).click();
    // Wait for page content to render
    await window.locator('main').getByText('Sync Config').waitFor();
  });

  test('shows sync info cards', async ({ window }) => {
    const main = window.locator('main');
    await expect(main.getByText('Sync Config')).toBeVisible();
    await expect(main.getByText('What gets synced:')).toBeVisible();
    await expect(main.getByText('Skills', { exact: true })).toBeVisible();
    await expect(main.getByText('Commands', { exact: true })).toBeVisible();
    await expect(main.getByText('MCP Servers', { exact: true })).toBeVisible();
  });

  test('can select different targets', async ({ window }) => {
    const main = window.locator('main');
    // Click gemini target
    await main.locator('button', { hasText: 'gemini' }).click();
    // Sync button should update
    await expect(
      main.locator('button', { hasText: 'Sync to gemini' }),
    ).toBeVisible();

    // Click "All"
    await main.locator('button', { hasText: '✨ All' }).click();
    await expect(
      main.locator('button', { hasText: 'Sync to all' }),
    ).toBeVisible();
  });

  test('output directory toggle works', async ({ window }) => {
    const main = window.locator('main');
    // Global should be selected by default
    await expect(
      main.getByText(/Syncs to your global home directory/),
    ).toBeVisible();

    // Switch to Local
    await main.locator('button', { hasText: 'Local' }).click();
    await expect(
      main.getByText(/Syncs to the project directory/),
    ).toBeVisible();

    // Switch back to Global
    await main.locator('button', { hasText: 'Global' }).first().click();
    await expect(
      main.getByText(/Syncs to your global home directory/),
    ).toBeVisible();
  });

  test('sync button is clickable and starts sync', async ({ window }) => {
    const main = window.locator('main');
    const syncBtn = main.locator('button', { hasText: /Sync to/ });
    await expect(syncBtn).toBeEnabled();
    await syncBtn.click();

    // Should show syncing or result state
    await expect(
      main.getByText(/Syncing|Sync complete|Sync failed/).first(),
    ).toBeVisible({ timeout: 30000 });
  });
});

// ─── Convert Page ────────────────────────────────────────────

test.describe('Convert Page', () => {
  test.beforeEach(async ({ electronApp, window }) => {
    await openTestProject(electronApp, window);
    await window.locator('nav button', { hasText: 'Convert' }).click();
    // Wait for page content to render
    await window.locator('main').getByText('Convert Plugin').waitFor();
  });

  test('shows all sections', async ({ window }) => {
    const main = window.locator('main');
    await expect(
      main.locator('h2', { hasText: 'Convert Plugin' }),
    ).toBeVisible();
    await expect(
      main.locator('h3', { hasText: 'Source Plugin' }),
    ).toBeVisible();
    await expect(
      main.locator('h3', { hasText: 'Target Formats' }),
    ).toBeVisible();
    await expect(
      main.locator('h3', { hasText: 'Output Directory' }),
    ).toBeVisible();
    await expect(main.locator('h3', { hasText: 'Options' })).toBeVisible();
  });

  test('select all/deselect all targets', async ({ window }) => {
    const main = window.locator('main');
    await main.getByText('Select all').click();
    await expect(main.getByText('Deselect all')).toBeVisible();

    await main.getByText('Deselect all').click();
    await expect(main.getByText('Select all')).toBeVisible();
  });

  test('output directory shows Project/Global toggle', async ({ window }) => {
    const main = window.locator('main');
    await expect(main.locator('button', { hasText: 'Project' })).toBeVisible();
    await expect(
      main.locator('button', { hasText: 'Global' }).first(),
    ).toBeVisible();
  });

  test('convert button disabled without source plugin', async ({ window }) => {
    const main = window.locator('main');
    const convertBtn = main.locator('button', { hasText: /Convert to/ });
    // disabled buttons have cursor-not-allowed class
    await expect(convertBtn).toHaveClass(/cursor-not-allowed/);
  });
});

// ─── Settings Page ───────────────────────────────────────────

test.describe('Settings Page', () => {
  test('shows settings content', async ({ electronApp, window }) => {
    await openTestProject(electronApp, window);
    await window.locator('nav button', { hasText: 'Settings' }).click();
    const main = window.locator('main');
    await expect(main.locator('h2', { hasText: 'Settings' })).toBeVisible();
  });
});

// ─── History Page ────────────────────────────────────────────

test.describe('History Page', () => {
  test('shows history content', async ({ electronApp, window }) => {
    await openTestProject(electronApp, window);
    await window.locator('nav button', { hasText: 'History' }).click();
    const main = window.locator('main');
    await expect(main.locator('h2', { hasText: 'History' })).toBeVisible();
  });
});
