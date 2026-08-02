import type { Core, NodeSingular } from 'cytoscape';
import type { Arc, IPetriNet, Marking, Place, Transition } from '~/types/petri-net-core';

export class CytoscapePetriNet implements IPetriNet {
  private cy: Core;

  constructor(cy: Core) {
    this.cy = cy;
  }

  private getInnerNode(nodeId: string): NodeSingular {
    const node = this.cy.getElementById(nodeId);
    if (node.length > 0 && node.data('type') === 'place') {
      const inner = node.children().first();
      if (inner.length > 0) {
        return inner;
      }
    }
    return node;
  }

  getPlaces(): Place[] {
    return this.cy.nodes('[type="place"]').map(node => ({
      id: node.id(),
      label: node.data('label') || '',
      position: node.position(),
    }));
  }

  getTransitions(): Transition[] {
    return this.cy.nodes('[type="transition"]').map(node => ({
      id: node.id(),
      label: node.data('label') || '',
      position: node.position(),
    }));
  }

  getArcs(): Arc[] {
    return this.cy.edges('[type="arc"]').map(edge => ({
      id: edge.id(),
      source: edge.data('source'),
      target: edge.data('target'),
      weight: edge.data('weight') || 1,
    }));
  }

  getMarking(): Marking {
    const marking: Marking = {};
    this.cy.nodes('[type="place"]').forEach((node) => {
      const inner = node.children().first();
      marking[node.id()] = inner.length > 0 ? (inner.data('tokens') || 0) : 0;
    });
    return marking;
  }

  setMarking(marking: Marking): void {
    for (const [placeId, tokens] of Object.entries(marking)) {
      this.setTokens(placeId, tokens);
    }
  }

  getTokens(placeId: string): number {
    const inner = this.getInnerNode(placeId);
    if (inner.length === 0) {
      return 0;
    }
    return inner.data('tokens') || 0;
  }

  setTokens(placeId: string, count: number): void {
    const inner = this.getInnerNode(placeId);
    if (inner.length === 0) {
      return;
    }
    inner.data('tokens', Math.max(0, count));
  }

  getInputPlaces(transitionId: string): Place[] {
    return this.cy.edges(`[type="arc"][target="${transitionId}"]`)
      .map((edge) => {
        const sourceNode = this.cy.getElementById(edge.data('source'));
        if (sourceNode.length === 0 || sourceNode.data('type') === 'transition') {
          return null;
        }
        return {
          id: sourceNode.id(),
          label: sourceNode.data('label') || '',
          position: sourceNode.position(),
        };
      })
      .filter((p): p is Place => p !== null);
  }

  getOutputPlaces(transitionId: string): Place[] {
    return this.cy.edges(`[type="arc"][source="${transitionId}"]`)
      .map((edge) => {
        const targetNode = this.cy.getElementById(edge.data('target'));
        if (targetNode.length === 0 || targetNode.data('type') === 'transition') {
          return null;
        }
        return {
          id: targetNode.id(),
          label: targetNode.data('label') || '',
          position: targetNode.position(),
        };
      })
      .filter((p): p is Place => p !== null);
  }

  private edgePlaceId(nodeId: string): string | null {
    const ele = this.cy.getElementById(nodeId);
    if (ele.length === 0 || ele.data('type') === 'transition') {
      return null;
    }
    const parent = ele.parent().first();
    if (parent.length > 0 && parent.data('type') === 'place') {
      return parent.id();
    }
    return ele.id();
  }

  getPreMarking(transitionId: string): Marking {
    const marking: Marking = {};
    this.cy.edges(`[type="arc"][target="${transitionId}"]`).forEach((edge) => {
      const placeId = this.edgePlaceId(edge.data('source'));
      if (placeId) {
        marking[placeId] = (marking[placeId] || 0) + (edge.data('weight') || 1);
      }
    });
    return marking;
  }

  getPostMarking(transitionId: string): Marking {
    const marking: Marking = {};
    this.cy.edges(`[type="arc"][source="${transitionId}"]`).forEach((edge) => {
      const placeId = this.edgePlaceId(edge.data('target'));
      if (placeId) {
        marking[placeId] = (marking[placeId] || 0) + (edge.data('weight') || 1);
      }
    });
    return marking;
  }

  isTransitionEnabled(transitionId: string): boolean {
    const inputArcs = this.cy.edges(`[type="arc"][target="${transitionId}"]`);
    if (inputArcs.length === 0) {
      return false;
    }
    return inputArcs.every((edge) => {
      const sourceId = edge.data('source');
      const weight = edge.data('weight') || 1;
      return this.getTokens(sourceId) >= weight;
    });
  }

  getEnabledTransitions(): Transition[] {
    return this.getTransitions().filter(t => this.isTransitionEnabled(t.id));
  }

  fireTransition(transitionId: string): Marking | null {
    if (!this.isTransitionEnabled(transitionId)) {
      return null;
    }

    const inputArcs = this.cy.edges(`[type="arc"][target="${transitionId}"]`);
    const outputArcs = this.cy.edges(`[type="arc"][source="${transitionId}"]`);

    for (const edge of inputArcs) {
      const sourceId = edge.data('source');
      const weight = edge.data('weight') || 1;
      this.setTokens(sourceId, this.getTokens(sourceId) - weight);
    }

    for (const edge of outputArcs) {
      const targetId = edge.data('target');
      const weight = edge.data('weight') || 1;
      this.setTokens(targetId, this.getTokens(targetId) + weight);
    }

    return this.getMarking();
  }

  addPlace(x: number, y: number, label?: string): Place {
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const placeLabel = label || `P${this.getPlaces().length + 1}`;
    const innerId = `${id}-inner`;

    this.cy.add({
      group: 'nodes',
      data: { id, type: 'place', label: placeLabel },
      position: { x, y },
      classes: 'place-wrapper',
    });
    this.cy.add({
      group: 'nodes',
      data: { id: innerId, parent: id, tokens: 0 },
      position: { x, y },
    });

    return { id, label: placeLabel, position: { x, y } };
  }

  addTransition(x: number, y: number, label?: string): Transition {
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const transitionLabel = label || `T${this.getTransitions().length + 1}`;

    this.cy.add({
      group: 'nodes',
      data: { id, type: 'transition', label: transitionLabel },
      position: { x, y },
    });

    return { id, label: transitionLabel, position: { x, y } };
  }

  addArc(sourceId: string, targetId: string, weight?: number): Arc {
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const arcWeight = weight && weight > 0 ? weight : 1;

    this.cy.add({
      group: 'edges',
      data: { id, type: 'arc', source: sourceId, target: targetId, weight: arcWeight },
    });

    return { id, source: sourceId, target: targetId, weight: arcWeight };
  }

  removeElement(id: string): void {
    const ele = this.cy.getElementById(id);
    if (ele.length > 0 && ele.data('type') === 'place' && ele.parent().length > 0) {
      ele.parent().remove();
    } else {
      ele.remove();
    }
  }
}
