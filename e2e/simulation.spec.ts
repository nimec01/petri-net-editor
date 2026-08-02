import { expect, test } from '@playwright/test';
import {
  clickNode,
  gotoEditor,
  historyLength,
  isAutoFiring,
  netModel,
  setMode,
  setupNet,
  transitionId,
} from './helpers';

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

test.describe('simulation', () => {
  test('fires a transition manually by clicking it', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    const t1 = await transitionId(page, 'T1');
    await setMode(page, 'fire');

    expect((await netModel(page)).enabledLabels).toEqual(['T1']);

    await clickNode(page, t1);

    expect(await historyLength(page)).toBe(1);
    const model = await netModel(page);
    expect(model.places.find(place => place.label === 'P1')!.tokens).toBe(0);
    expect(model.places.find(place => place.label === 'P2')!.tokens).toBe(1);
  });

  test('does not fire a disabled transition', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [
        { label: 'P1', tokens: 1, x: 100, y: 200 },
        { label: 'P2', x: 400, y: 200 },
        { label: 'P3', x: 700, y: 200 },
        { label: 'P4', x: 1000, y: 200 },
      ],
      transitions: [{ label: 'T1', x: 250, y: 200 }, { label: 'T2', x: 850, y: 200 }],
      arcs: [
        { from: 'P1', to: 'T1' },
        { from: 'T1', to: 'P2' },
        { from: 'P3', to: 'T2' },
        { from: 'T2', to: 'P4' },
      ],
    });

    const t2 = await transitionId(page, 'T2');
    await setMode(page, 'fire');

    await clickNode(page, t2);

    expect(await historyLength(page)).toBe(0);
    expect((await netModel(page)).enabledLabels).toEqual(['T1']);
  });

  test('records an execution trace with markings', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    const t1 = await transitionId(page, 'T1');
    const t2 = await transitionId(page, 'T2');
    await setMode(page, 'fire');

    await clickNode(page, t1);
    await clickNode(page, t2);

    const firstEntry = page.getByTestId('history-entry-1');
    const secondEntry = page.getByTestId('history-entry-2');
    await expect(firstEntry).toContainText('T1');
    await expect(firstEntry).toContainText('P1:0 P2:1 P3:0');
    await expect(secondEntry).toContainText('T2');
    await expect(secondEntry).toContainText('P1:0 P2:0 P3:1');
  });

  test('fires one step at a time', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    await setMode(page, 'fire');
    await page.getByTestId('fire-one-step').click();
    expect(await historyLength(page)).toBe(1);

    await page.getByTestId('fire-one-step').click();
    expect(await historyLength(page)).toBe(2);
  });

  test('fires a chosen number of steps with the Go button', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 3, x: 100, y: 200 }],
      transitions: [{ label: 'T1', x: 400, y: 200 }],
      arcs: [{ from: 'P1', to: 'T1' }, { from: 'T1', to: 'P1' }],
    });

    await setMode(page, 'fire');
    await page.getByTestId('fire-n').fill('2');
    await page.getByTestId('fire-go').click();

    await expect.poll(async () => historyLength(page)).toBe(2);
    expect((await netModel(page)).places.find(place => place.label === 'P1')!.tokens).toBe(3);
  });

  test('auto-fires until no transition is enabled', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    await setMode(page, 'fire');
    await page.getByTestId('auto-fire').click();

    await expect.poll(async () => historyLength(page)).toBe(2);
    await expect.poll(async () => isAutoFiring(page)).toBe(false);
  });

  test('reverts the last firing', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    const t1 = await transitionId(page, 'T1');
    const t2 = await transitionId(page, 'T2');
    await setMode(page, 'fire');

    await clickNode(page, t1);
    await clickNode(page, t2);
    expect(await historyLength(page)).toBe(2);

    await page.getByTestId('history-revert').click();

    expect(await historyLength(page)).toBe(1);
    const model = await netModel(page);
    expect(model.places.find(place => place.label === 'P2')!.tokens).toBe(1);
    expect(model.places.find(place => place.label === 'P3')!.tokens).toBe(0);
  });

  test('clears the firing history and restores the initial marking', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    const t1 = await transitionId(page, 'T1');
    const t2 = await transitionId(page, 'T2');
    await setMode(page, 'fire');

    await clickNode(page, t1);
    await clickNode(page, t2);
    expect(await historyLength(page)).toBe(2);

    await page.getByTestId('history-clear').click();

    expect(await historyLength(page)).toBe(0);
    const model = await netModel(page);
    expect(model.places.find(place => place.label === 'P1')!.tokens).toBe(1);
  });

  test('exiting fire mode restores the initial marking', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, chainNet);

    const t1 = await transitionId(page, 'T1');
    await setMode(page, 'fire');

    await clickNode(page, t1);
    await clickNode(page, t1);
    expect((await netModel(page)).places.find(place => place.label === 'P1')!.tokens).toBe(0);

    await setMode(page, 'fire');

    expect(await historyLength(page)).toBe(0);
    expect((await netModel(page)).places.find(place => place.label === 'P1')!.tokens).toBe(1);
  });
});
