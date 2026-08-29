import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface NetSpecPlace {
  label: string;
  tokens?: number;
  x?: number;
  y?: number;
}

export interface NetSpecTransition {
  label: string;
  x?: number;
  y?: number;
}

export interface NetSpecArc {
  from: string;
  to: string;
  weight?: number;
}

export interface NetSpec {
  places: NetSpecPlace[];
  transitions: NetSpecTransition[];
  arcs: NetSpecArc[];
}

export interface NetModel {
  places: Array<{ id: string; label: string; tokens: number }>;
  transitions: Array<{ id: string; label: string }>;
  arcs: Array<{ id: string; source: string; target: string; weight: number }>;
  enabledLabels: string[];
  zoom: number;
  pan: { x: number; y: number };
}

export async function gotoEditor(page: Page): Promise<void> {
  await page.goto('/editor');
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await page.waitForFunction(() => window.__PETRI_NET_DEBUG__?.cy.value != null);
}

export async function setupNet(page: Page, net: NetSpec): Promise<void> {
  await page.evaluate((spec) => {
    const pn = window.__PETRI_NET_DEBUG__;
    if (!pn)
      throw new Error('debug hook unavailable');
    const ids = new Map<string, string>();
    for (const place of spec.places) {
      const innerId = pn.addPlace(place.x ?? 0, place.y ?? 0);
      const wrapper = pn.cy.value!.getElementById(innerId).parent().first();
      wrapper.data('label', place.label);
      if (place.tokens !== undefined) {
        pn.setTokens(innerId, place.tokens);
      }
      ids.set(place.label, innerId);
    }
    for (const transition of spec.transitions) {
      const id = pn.addTransition(transition.x ?? 0, transition.y ?? 0);
      pn.cy.value!.getElementById(id).data('label', transition.label);
      ids.set(transition.label, id);
    }
    for (const arc of spec.arcs) {
      pn.addArc(ids.get(arc.from)!, ids.get(arc.to)!, arc.weight);
    }
    pn.zoomToFit();
  }, net);
  await page.waitForTimeout(50);
}

export async function netModel(page: Page): Promise<NetModel> {
  return page.evaluate(() => {
    const pn = window.__PETRI_NET_DEBUG__!;
    const net = pn.petriNet.value!;
    const cy = pn.cy.value!;
    return {
      places: net.getPlaces().map(place => ({ id: place.id, label: place.label, tokens: net.getTokens(place.id) })),
      transitions: net.getTransitions().map(transition => ({ id: transition.id, label: transition.label })),
      arcs: net.getArcs().map(arc => ({ id: arc.id, source: arc.source, target: arc.target, weight: arc.weight })),
      enabledLabels: net.getEnabledTransitions().map(transition => transition.label),
      zoom: cy.zoom(),
      pan: { x: cy.pan().x, y: cy.pan().y },
    };
  });
}

export async function exportJson(page: Page): Promise<unknown> {
  return page.evaluate(() => window.__PETRI_NET_DEBUG__!.exportToJson());
}

export async function historyLength(page: Page): Promise<number> {
  return page.evaluate(() => window.__PETRI_NET_DEBUG__!.firingHistory.value.length);
}

export async function isAutoFiring(page: Page): Promise<boolean> {
  return page.evaluate(() => window.__PETRI_NET_DEBUG__!.autoFiring.value);
}

export async function undoStackLength(page: Page): Promise<number> {
  return page.evaluate(() => window.__PETRI_NET_DEBUG__!.undoStack.value.length);
}

export async function redoStackLength(page: Page): Promise<number> {
  return page.evaluate(() => window.__PETRI_NET_DEBUG__!.redoStack.value.length);
}

export async function nodeRenderedPosition(page: Page, id: string): Promise<{ x: number; y: number }> {
  return page.evaluate((nodeId) => {
    const cy = window.__PETRI_NET_DEBUG__!.cy.value!;
    const pos = cy.getElementById(nodeId).renderedPosition();
    return { x: pos.x, y: pos.y };
  }, id);
}

export async function nodePosition(page: Page, id: string): Promise<{ x: number; y: number }> {
  return page.evaluate((nodeId) => {
    const cy = window.__PETRI_NET_DEBUG__!.cy.value!;
    const pos = cy.getElementById(nodeId).position();
    return { x: pos.x, y: pos.y };
  }, id);
}

export async function placeId(page: Page, label: string): Promise<string> {
  const model = await netModel(page);
  const place = model.places.find(p => p.label === label);
  if (!place)
    throw new Error(`place "${label}" not found`);
  return place.id;
}

export async function transitionId(page: Page, label: string): Promise<string> {
  const model = await netModel(page);
  const transition = model.transitions.find(t => t.label === label);
  if (!transition)
    throw new Error(`transition "${label}" not found`);
  return transition.id;
}

export async function clickCanvasAt(page: Page, renderedX: number, renderedY: number): Promise<void> {
  const box = await page.getByTestId('editor-canvas').boundingBox();
  if (!box)
    throw new Error('canvas not found');
  await page.mouse.click(box.x + renderedX, box.y + renderedY);
}

export async function clickNode(page: Page, id: string): Promise<void> {
  const pos = await nodeRenderedPosition(page, id);
  await clickCanvasAt(page, pos.x, pos.y);
}

export async function setMode(page: Page, mode: string): Promise<void> {
  await page.getByTestId(`mode-${mode}`).click();
}

export async function dragNode(page: Page, id: string, deltaX: number, deltaY: number): Promise<void> {
  const box = await page.getByTestId('editor-canvas').boundingBox();
  if (!box)
    throw new Error('canvas not found');
  const pos = await nodeRenderedPosition(page, id);
  const startX = box.x + pos.x;
  const startY = box.y + pos.y;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
  await page.mouse.up();
}

export async function dragBackground(page: Page, deltaX: number, deltaY: number): Promise<void> {
  const box = await page.getByTestId('editor-canvas').boundingBox();
  if (!box)
    throw new Error('canvas not found');
  const model = await netModel(page);
  const occupied = [
    ...model.places.map(place => place.id),
    ...model.transitions.map(transition => transition.id),
  ];
  const positions: Array<{ x: number; y: number }> = [];
  for (const id of occupied) {
    positions.push(await nodeRenderedPosition(page, id));
  }
  const candidates = [
    { x: box.width - 100, y: box.height - 100 },
    { x: 100, y: box.height - 100 },
    { x: box.width - 100, y: 120 },
  ];
  let point = { x: box.width / 2, y: box.height - 80 };
  for (const candidate of candidates) {
    const isFree = positions.every(pos => Math.hypot(pos.x - candidate.x, pos.y - candidate.y) > 120);
    if (isFree) {
      point = candidate;
      break;
    }
  }
  const startX = box.x + point.x;
  const startY = box.y + point.y;
  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 8 });
  await page.mouse.up({ button: 'middle' });
}

export async function openExtension(page: Page, name: string): Promise<void> {
  await page.getByTestId('extensions-toggle').click();
  await page.getByRole('button', { name, exact: true }).click();
}
