import { expect, test } from '@playwright/test';
import { gotoEditor, netModel, setupNet } from './helpers';

const sampleNet = {
  places: [
    { label: 'P1', tokens: 2, x: 100, y: 200 },
    { label: 'P2', x: 400, y: 200 },
  ],
  transitions: [{ label: 'T1', x: 250, y: 200 }],
  arcs: [
    { from: 'P1', to: 'T1' },
    { from: 'T1', to: 'P2' },
  ],
};

test.describe('save / load / share', () => {
  test('exports the net as JSON and imports it back', async ({ page }) => {
    await gotoEditor(page);
    await setupNet(page, sampleNet);

    await page.getByTestId('save').click();
    const jsonText = await page.getByTestId('export-json').inputValue();
    const exported = JSON.parse(jsonText) as { elements: Array<{ type: string; label: string; tokens?: number }> };

    expect(exported.elements).toHaveLength(5);
    const place = exported.elements.find(el => el.type === 'place' && el.label === 'P1');
    expect(place?.tokens).toBe(2);
    expect(exported.elements.some(el => el.type === 'transition' && el.label === 'T1')).toBe(true);
    expect(exported.elements.some(el => el.type === 'arc')).toBe(true);

    await page.getByRole('button', { name: 'Close', exact: true }).click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId('clear-net').click();

    const empty = await netModel(page);
    expect(empty.places).toHaveLength(0);

    await page.getByTestId('load').click();
    await page.getByTestId('import-json').fill(jsonText);
    await page.getByTestId('import-confirm').click();

    const model = await netModel(page);
    expect(model.places.map(place => place.label)).toEqual(['P1', 'P2']);
    expect(model.places.find(place => place.label === 'P1')!.tokens).toBe(2);
    expect(model.transitions.map(transition => transition.label)).toEqual(['T1']);
    expect(model.arcs).toHaveLength(2);
  });

  test('rejects malformed JSON on import', async ({ page }) => {
    await gotoEditor(page);

    await page.getByTestId('load').click();
    await page.getByTestId('import-json').fill('not valid json');
    await page.getByTestId('import-confirm').click();

    await expect(page.getByText('Invalid JSON. Please check the input.')).toBeVisible();
  });

  test('rejects JSON without an elements array', async ({ page }) => {
    await gotoEditor(page);

    await page.getByTestId('load').click();
    await page.getByTestId('import-json').fill('{"version":"0.1.0"}');
    await page.getByTestId('import-confirm').click();

    await expect(page.getByText('Invalid format: missing "elements" array.')).toBeVisible();
  });

  test('shares a link that restores the net in a new page', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:3000' });
    await gotoEditor(page);
    await setupNet(page, sampleNet);

    await page.getByTestId('share').click();

    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toMatch(/^http:\/\/localhost:3000\/editor#/);

    const shared = await context.newPage();
    await shared.goto(url);
    await expect(shared.getByTestId('editor-canvas')).toBeVisible();
    await shared.waitForFunction(() => window.__PETRI_NET_DEBUG__?.cy.value != null);

    const model = await netModel(shared);
    expect(model.places.map(place => place.label)).toEqual(['P1', 'P2']);
    expect(model.places.find(place => place.label === 'P1')!.tokens).toBe(2);
    expect(model.transitions.map(transition => transition.label)).toEqual(['T1']);
    expect(model.arcs).toHaveLength(2);

    await shared.close();
  });
});
