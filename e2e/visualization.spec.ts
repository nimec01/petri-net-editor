import { expect, test } from '@playwright/test';
import {
  dragBackground,
  gotoEditor,
  netModel,
  nodePosition,
  placeId,
  setMode,
  setupNet,
  transitionId,
} from './helpers';

test.describe('visualization', () => {
  test('zooms in and out via toolbar buttons', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 1, x: 100, y: 200 }, { label: 'P2', x: 600, y: 200 }],
      transitions: [{ label: 'T1', x: 350, y: 200 }],
      arcs: [{ from: 'P1', to: 'T1' }, { from: 'T1', to: 'P2' }],
    });

    const initialZoom = (await netModel(page)).zoom;
    await page.getByTestId('zoom-in').click();
    const zoomedIn = (await netModel(page)).zoom;
    expect(zoomedIn).toBeGreaterThan(initialZoom);

    await page.getByTestId('zoom-out').click();
    const zoomedOut = (await netModel(page)).zoom;
    expect(zoomedOut).toBeLessThan(zoomedIn);
  });

  test('fits the net to the screen', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 1, x: 100, y: 200 }, { label: 'P2', x: 600, y: 200 }],
      transitions: [{ label: 'T1', x: 350, y: 200 }],
      arcs: [{ from: 'P1', to: 'T1' }, { from: 'T1', to: 'P2' }],
    });

    await page.getByTestId('zoom-in').click();
    await page.getByTestId('zoom-in').click();

    await page.getByTestId('zoom-fit').click();

    const model = await netModel(page);
    expect(model.zoom).toBeGreaterThan(0);
    for (const place of model.places) {
      const pos = await nodePosition(page, place.id);
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    }
  });

  test('pans the canvas by dragging the background', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 1, x: 100, y: 200 }, { label: 'P2', x: 600, y: 200 }],
      transitions: [{ label: 'T1', x: 350, y: 200 }],
      arcs: [{ from: 'P1', to: 'T1' }, { from: 'T1', to: 'P2' }],
    });

    const before = (await netModel(page)).pan;
    await setMode(page, 'select');
    await dragBackground(page, 120, 80);

    const after = (await netModel(page)).pan;
    expect(after.x).not.toBe(before.x);
    expect(after.y).not.toBe(before.y);
  });

  test('applies a circle layout to the net', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', x: 0, y: 0 }, { label: 'P2', x: 400, y: 0 }],
      transitions: [{ label: 'T1', x: 800, y: 0 }, { label: 'T2', x: 1200, y: 0 }],
      arcs: [{ from: 'P1', to: 'T1' }, { from: 'P1', to: 'T2' }],
    });

    const beforePositions = await Promise.all(
      (await netModel(page)).places.map(place => nodePosition(page, place.id)),
    );

    await page.getByTestId('layout-dropdown').click();
    await page.getByRole('button', { name: 'Circle' }).click();
    await page.waitForTimeout(700);

    const model = await netModel(page);
    const afterPositions = await Promise.all(model.places.map(place => nodePosition(page, place.id)));

    for (let index = 0; index < model.places.length; index++) {
      expect(afterPositions[index]!.x).not.toBe(beforePositions[index]!.x);
      expect(afterPositions[index]!.y).not.toBe(beforePositions[index]!.y);
    }
  });

  test('highlights enabled transitions in fire mode', async ({ page }) => {
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

    const t1 = await transitionId(page, 'T1');
    const t2 = await transitionId(page, 'T2');

    await setMode(page, 'fire');

    const model = await netModel(page);
    expect(model.enabledLabels).toEqual(['T1']);

    const highlighted = await page.evaluate(({ enabled, disabled }) => {
      const cy = window.__PETRI_NET_DEBUG__!.cy.value!;
      return {
        enabled: cy.getElementById(enabled).hasClass('enabled-transition'),
        disabled: cy.getElementById(disabled).hasClass('enabled-transition'),
      };
    }, { enabled: t1, disabled: t2 });

    expect(highlighted.enabled).toBe(true);
    expect(highlighted.disabled).toBe(false);
  });

  test('shows labels for places and transitions in the properties panel', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 2, x: 100, y: 200 }],
      transitions: [{ label: 'Fire', x: 400, y: 200 }],
      arcs: [{ from: 'P1', to: 'Fire' }],
    });

    const selectNode = (id: string): Promise<void> => {
      return page.evaluate((nodeId) => {
        window.__PETRI_NET_DEBUG__!.cy.value!.getElementById(nodeId).select();
      }, id);
    };

    await selectNode(await placeId(page, 'P1'));
    await expect(page.getByTestId('prop-label')).toHaveValue('P1');
    await expect(page.getByTestId('prop-tokens')).toHaveValue('2');

    await page.getByTestId('prop-close').click();
    await selectNode(await transitionId(page, 'Fire'));
    await expect(page.getByTestId('prop-label')).toHaveValue('Fire');
  });
});
