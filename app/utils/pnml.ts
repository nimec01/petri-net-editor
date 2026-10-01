import type { PetriNetElementData, PetriNetState } from '~/types/petri-net';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;');
}

function elementText(element: Element, name: string): string {
  return element.querySelector(`:scope > ${name} > text`)?.textContent?.trim() ?? '';
}

function numericAttribute(element: Element, name: string, fallback: number): number {
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) ? value : fallback;
}

function positiveInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function exportToPnml(state: PetriNetState): string {
  const places = state.elements.filter(element => element.type === 'place');
  const transitions = state.elements.filter(element => element.type === 'transition');
  const arcs = state.elements.filter(element => element.type === 'arc');
  const pageId = 'page0';

  const placeXml = places.map((place) => {
    const marking = place.tokens && place.tokens > 0
      ? `\n        <initialMarking><text>${place.tokens}</text></initialMarking>`
      : '';
    return `      <place id="${escapeXml(place.id)}">
        <name><text>${escapeXml(place.label)}</text></name>${marking}
        <graphics><position x="${place.x ?? 0}" y="${place.y ?? 0}" /></graphics>
      </place>`;
  }).join('\n');
  const transitionXml = transitions.map(transition => `      <transition id="${escapeXml(transition.id)}">
        <name><text>${escapeXml(transition.label)}</text></name>
        <graphics><position x="${transition.x ?? 0}" y="${transition.y ?? 0}" /></graphics>
      </transition>`).join('\n');
  const arcXml = arcs.map((arc) => {
    const inscription = arc.weight && arc.weight !== 1
      ? `\n        <inscription><text>${arc.weight}</text></inscription>`
      : '';
    return `      <arc id="${escapeXml(arc.id)}" source="${escapeXml(arc.source ?? '')}" target="${escapeXml(arc.target ?? '')}">${inscription}
      </arc>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<pnml xmlns="http://www.pnml.org/version-2009/grammar/pnml">
  <net id="net0" type="http://www.pnml.org/version-2009/grammar/ptnet">
    <name><text>${escapeXml(state.title ?? 'Petri Net')}</text></name>
    <page id="${pageId}">
${placeXml}${placeXml && (transitionXml || arcXml) ? '\n' : ''}${transitionXml}${transitionXml && arcXml ? '\n' : ''}${arcXml}
    </page>
  </net>
</pnml>
`;
}

export function importFromPnml(xml: string): PetriNetState {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = document.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid PNML XML.');
  }

  const net = document.getElementsByTagNameNS('*', 'net')[0];
  if (!net) {
    throw new Error('Invalid PNML: missing net element.');
  }

  const elements: PetriNetElementData[] = [];
  const nodeIds = new Set<string>();
  const nodes = [...net.getElementsByTagNameNS('*', 'place'), ...net.getElementsByTagNameNS('*', 'transition')];
  for (const node of nodes) {
    const id = node.getAttribute('id')?.trim();
    if (!id || nodeIds.has(id)) {
      throw new Error('Invalid PNML: places and transitions must have unique IDs.');
    }
    nodeIds.add(id);
    const type = node.localName === 'place' ? 'place' : 'transition';
    const position = node.getElementsByTagNameNS('*', 'position')[0];
    const element: PetriNetElementData = {
      id,
      type,
      label: elementText(node, 'name') || id,
      x: position ? numericAttribute(position, 'x', 0) : 0,
      y: position ? numericAttribute(position, 'y', 0) : 0,
    };
    if (type === 'place') {
      const marking = elementText(node, 'initialMarking');
      const tokens = marking ? Number.parseInt(marking, 10) : 0;
      if (Number.isInteger(tokens) && tokens > 0) {
        element.tokens = tokens;
      }
    }
    elements.push(element);
  }

  const arcIds = new Set<string>();
  for (const arc of net.getElementsByTagNameNS('*', 'arc')) {
    const id = arc.getAttribute('id')?.trim();
    const source = arc.getAttribute('source')?.trim();
    const target = arc.getAttribute('target')?.trim();
    if (!id || nodeIds.has(id) || arcIds.has(id) || !source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
      throw new Error('Invalid PNML: arcs must have unique IDs and valid source and target nodes.');
    }
    arcIds.add(id);
    const inscription = elementText(arc, 'inscription');
    elements.push({
      id,
      type: 'arc',
      label: '',
      source,
      target,
      weight: inscription ? positiveInteger(inscription, 1) : 1,
    });
  }

  return {
    elements,
    formatVersion: 1,
    title: elementText(net, 'name') || undefined,
  };
}
