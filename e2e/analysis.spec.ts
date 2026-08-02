import { expect, test } from '@playwright/test';
import { gotoEditor, openExtension, setupNet } from './helpers';

const chainNet = {
  places: [
    { label: 'P1', tokens: 1, x: 100, y: 200 },
    { label: 'P2', x: 400, y: 200 },
    { label: 'P3', x: 700, y: 200 },
  ],
  transitions: [{ label: 'T1', x: 250, y: 200 }, { label: 'T2', x: 550, y: 200 }],
  arcs: [
    { from: 'P1', to: 'T1' },
    { from: 'T1', to: 'P2' },
    { from: 'P2', to: 'T2' },
    { from: 'T2', to: 'P3' },
  ],
};

const cycleNet = {
  places: [
    { label: 'P1', tokens: 1, x: 100, y: 200 },
    { label: 'P2', x: 400, y: 200 },
  ],
  transitions: [{ label: 'T1', x: 250, y: 200 }, { label: 'T2', x: 550, y: 200 }],
  arcs: [
    { from: 'P1', to: 'T1' },
    { from: 'T1', to: 'P2' },
    { from: 'P2', to: 'T2' },
    { from: 'T2', to: 'P1' },
  ],
};

const unboundedNet = {
  places: [
    { label: 'P1', tokens: 1, x: 100, y: 200 },
    { label: 'P2', x: 400, y: 200 },
  ],
  transitions: [{ label: 'T1', x: 250, y: 200 }],
  arcs: [
    { from: 'P1', to: 'T1' },
    { from: 'T1', to: 'P1' },
    { from: 'T1', to: 'P2' },
  ],
};

test.describe('analysis', () => {
  test('reachability check finds a firing sequence to a target marking', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);
    await openExtension(page, 'Reachability Check');

    await page.getByRole('spinbutton', { name: 'P1' }).fill('0');
    await page.getByRole('spinbutton', { name: 'P3' }).fill('1');
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Reachable', { exact: true })).toBeVisible();
    await expect(page.getByText('Marking (0, 0, 1) is reachable.')).toBeVisible();
    await expect(page.getByText('T1 → T2')).toBeVisible();
  });

  test('reachability check reports an unreachable marking', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);
    await openExtension(page, 'Reachability Check');

    await page.getByRole('spinbutton', { name: 'P3' }).fill('1');
    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Not reachable', { exact: true })).toBeVisible();
    await expect(page.getByText('Marking (1, 0, 1) is not reachable.')).toBeVisible();
  });

  test('liveness check reports non-live transitions for a chain net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);
    await openExtension(page, 'Liveness Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Not all transitions live', { exact: true })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table).toContainText('T1');
    await expect(table).toContainText('T2');
  });

  test('liveness check reports a fully live net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, cycleNet);
    await openExtension(page, 'Liveness Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('All transitions live', { exact: true })).toBeVisible();
  });

  test('boundedness check marks a cyclic net as bounded', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, cycleNet);
    await openExtension(page, 'Boundedness Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.locator('.badge').filter({ hasText: 'Bounded' })).toBeVisible();
  });

  test('boundedness check detects an unbounded net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, unboundedNet);
    await openExtension(page, 'Boundedness Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Unbounded', { exact: true })).toBeVisible();
  });

  test('deadlock check finds the deadlock of a chain net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);
    await openExtension(page, 'Deadlock Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Deadlock reachable', { exact: true })).toBeVisible();
    await expect(page.getByText('(0, 0, 1)')).toBeVisible();
    await expect(page.getByText('T1 → T2')).toBeVisible();
  });

  test('deadlock check finds no deadlock in a cyclic net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, cycleNet);
    await openExtension(page, 'Deadlock Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('No deadlock found', { exact: true })).toBeVisible();
  });

  test('safeness check reports a safe net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, cycleNet);
    await openExtension(page, 'Safeness Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Net is safe', { exact: true })).toBeVisible();
  });

  test('safeness check reports an unsafe net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, unboundedNet);
    await openExtension(page, 'Safeness Check');

    await page.getByRole('button', { name: 'Run', exact: true }).click();

    await expect(page.getByText('Net is not safe', { exact: true })).toBeVisible();
  });

  test('reachability graph shows the markings and firings of a net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);
    await openExtension(page, 'Reachability Graph');

    const markings = page.locator('.stat').filter({ hasText: 'Markings' }).locator('.stat-value');
    const firings = page.locator('.stat').filter({ hasText: 'Firings' }).locator('.stat-value');

    await expect(markings).toHaveText('3');
    await expect(firings).toHaveText('2');
    await expect(page.getByText('Complete', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'More markings' })).toBeDisabled();
  });

  test('math notation renders the net as a KaTeX formula', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);
    await openExtension(page, 'Math Notation');

    const katex = page.locator('.katex');
    await expect(katex.first()).toBeVisible();
    await expect(katex.first()).toContainText('P1');
    await expect(katex.first()).toContainText('T1');
  });
});
