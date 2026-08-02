import type { Core } from 'cytoscape';
import cytoscape from 'cytoscape';
import { CytoscapePetriNet } from '~/types/cytoscape-petri-net';

export interface PlaceSpec {
  name: string;
  tokens?: number;
}

export interface ArcSpec {
  from: string;
  to: string;
  weight?: number;
}

export interface CytoscapeNet {
  net: CytoscapePetriNet;
  cy: Core;
  ids: Map<string, string>;
}

export function createCytoscapePetriNet(
  places: PlaceSpec[],
  transitions: string[],
  arcs: ArcSpec[],
): CytoscapeNet {
  const cy = cytoscape({ style: [], layout: { name: 'preset' } });
  const ids = new Map<string, string>();

  for (const place of places) {
    const id = `place-${place.name}`;
    ids.set(place.name, id);
    cy.add({
      group: 'nodes',
      data: { id, type: 'place', label: place.name },
      position: { x: 0, y: 0 },
    });
    cy.add({
      group: 'nodes',
      data: { id: `${id}-inner`, parent: id, tokens: place.tokens ?? 0 },
      position: { x: 0, y: 0 },
    });
  }
  for (const name of transitions) {
    const id = `transition-${name}`;
    ids.set(name, id);
    cy.add({
      group: 'nodes',
      data: { id, type: 'transition', label: name },
      position: { x: 0, y: 0 },
    });
  }
  for (let index = 0; index < arcs.length; index++) {
    const arc = arcs[index]!;
    cy.add({
      group: 'edges',
      data: {
        id: `arc-${index}`,
        type: 'arc',
        source: ids.get(arc.from)!,
        target: ids.get(arc.to)!,
        weight: arc.weight ?? 1,
      },
    });
  }

  return { net: new CytoscapePetriNet(cy), cy, ids };
}
