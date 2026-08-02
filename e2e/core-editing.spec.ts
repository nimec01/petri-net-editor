import { expect, test } from '@playwright/test';
import {
  clickCanvasAt,
  clickNode,
  dragNode,
  gotoEditor,
  netModel,
  nodePosition,
  placeId,
  redoStackLength,
  setMode,
  setupNet,
  transitionId,
  undoStackLength,
} from './helpers';

test.describe('core editing', () => {
  test('creates a place by clicking the canvas', async ({ page }) => {
    await gotoEditor(page);

    await setMode(page, 'place');
    await clickCanvasAt(page, 300, 350);

    const model = await netModel(page);
    expect(model.places).toHaveLength(1);
    expect(model.places[0]!.label).toBe('P1');
    expect(model.places[0]!.tokens).toBe(0);
  });

  test('creates a transition by clicking the canvas', async ({ page }) => {
    await gotoEditor(page);

    await setMode(page, 'transition');
    await clickCanvasAt(page, 700, 350);

    const model = await netModel(page);
    expect(model.transitions).toHaveLength(1);
    expect(model.transitions[0]!.label).toBe('T1');
  });

  test('edits place label and tokens through the properties panel', async ({ page }) => {
    await gotoEditor(page);
    await setMode(page, 'place');
    await clickCanvasAt(page, 300, 350);
    await setMode(page, 'select');
    await clickCanvasAt(page, 300, 350);

    const labelInput = page.getByTestId('prop-label');
    await expect(labelInput).toBeVisible();
    await expect(labelInput).toHaveValue('P1');

    await labelInput.fill('Start');
    const tokensInput = page.getByTestId('prop-tokens');
    await tokensInput.fill('2');
    await tokensInput.blur();

    const model = await netModel(page);
    expect(model.places[0]!.label).toBe('Start');
    expect(model.places[0]!.tokens).toBe(2);

    await page.getByTestId('undo').click();
    await expect(labelInput).toHaveValue('Start');
    await expect(tokensInput).toHaveValue('0');
    expect((await netModel(page)).places[0]!.tokens).toBe(0);

    await page.getByTestId('undo').click();
    await expect(labelInput).toHaveValue('P1');
    expect((await netModel(page)).places[0]!.label).toBe('P1');
  });

  test('adds tokens to a place in token mode', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, { places: [{ label: 'P1' }], transitions: [], arcs: [] });

    const id = await placeId(page, 'P1');
    await setMode(page, 'token');
    await clickNode(page, id);

    expect((await netModel(page)).places[0]!.tokens).toBe(1);

    await clickNode(page, id);
    expect((await netModel(page)).places[0]!.tokens).toBe(2);
  });

  test('creates an arc between a place and a transition', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', x: 100, y: 200 }],
      transitions: [{ label: 'T1', x: 400, y: 200 }],
      arcs: [],
    });

    const placeIdValue = await placeId(page, 'P1');
    const transitionIdValue = await transitionId(page, 'T1');

    await setMode(page, 'arc');
    await clickNode(page, placeIdValue);
    await clickNode(page, transitionIdValue);

    const model = await netModel(page);
    expect(model.arcs).toHaveLength(1);
    expect(model.arcs[0]!.source).toContain(placeIdValue);
    expect(model.arcs[0]!.target).toBe(transitionIdValue);
    expect(model.arcs[0]!.weight).toBe(1);
  });

  test('deletes a transition and its arcs in delete mode', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 1, x: 100, y: 200 }, { label: 'P2', x: 600, y: 200 }],
      transitions: [{ label: 'T1', x: 350, y: 200 }],
      arcs: [{ from: 'P1', to: 'T1' }, { from: 'T1', to: 'P2' }],
    });

    const id = await transitionId(page, 'T1');
    await setMode(page, 'delete');
    await clickNode(page, id);

    const model = await netModel(page);
    expect(model.transitions).toHaveLength(0);
    expect(model.arcs).toHaveLength(0);
    expect(model.places).toHaveLength(2);
  });

  test('deletes a place from the properties panel', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, { places: [{ label: 'P1', x: 100, y: 200 }], transitions: [], arcs: [] });

    const id = await placeId(page, 'P1');
    await setMode(page, 'select');
    await clickNode(page, id);

    await expect(page.getByTestId('prop-delete')).toBeVisible();
    await page.getByTestId('prop-delete').click();

    const model = await netModel(page);
    expect(model.places).toHaveLength(0);
    await expect(page.getByTestId('prop-delete')).not.toBeVisible();
  });

  test('moves a place with drag and drop', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, { places: [{ label: 'P1', x: 100, y: 200 }], transitions: [], arcs: [] });

    const id = await placeId(page, 'P1');
    const before = await nodePosition(page, id);
    const zoom = (await netModel(page)).zoom;

    await setMode(page, 'select');
    await dragNode(page, id, 150, 90);

    const after = await nodePosition(page, id);
    expect(after.x - before.x).toBeCloseTo(150 / zoom, 0);
    expect(after.y - before.y).toBeCloseTo(90 / zoom, 0);
  });

  test('undoes and redoes element creation via buttons', async ({ page }) => {
    await gotoEditor(page);

    await setMode(page, 'place');
    await clickCanvasAt(page, 300, 350);
    expect(await undoStackLength(page)).toBe(1);

    await page.getByTestId('undo').click();
    expect((await netModel(page)).places).toHaveLength(0);
    expect(await redoStackLength(page)).toBe(1);

    await page.getByTestId('redo').click();
    expect((await netModel(page)).places).toHaveLength(1);
    expect(await undoStackLength(page)).toBe(1);
  });

  test('undoes and redoes via keyboard shortcuts', async ({ page }) => {
    await gotoEditor(page);

    await setMode(page, 'transition');
    await clickCanvasAt(page, 700, 350);
    expect(await undoStackLength(page)).toBe(1);

    await page.keyboard.press('Control+z');
    expect((await netModel(page)).transitions).toHaveLength(0);

    await page.keyboard.press('Control+Shift+z');
    expect((await netModel(page)).transitions).toHaveLength(1);

    await page.keyboard.press('Control+z');
    expect((await netModel(page)).transitions).toHaveLength(0);

    await page.keyboard.press('Control+y');
    expect((await netModel(page)).transitions).toHaveLength(1);
  });

  test('clears the entire net from the toolbar', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, {
      places: [{ label: 'P1', tokens: 1, x: 100, y: 200 }],
      transitions: [{ label: 'T1', x: 400, y: 200 }],
      arcs: [{ from: 'P1', to: 'T1' }],
    });

    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId('clear-net').click();

    const model = await netModel(page);
    expect(model.places).toHaveLength(0);
    expect(model.transitions).toHaveLength(0);
    expect(model.arcs).toHaveLength(0);
  });
});
