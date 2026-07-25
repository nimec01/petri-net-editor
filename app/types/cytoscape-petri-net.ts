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

  isTransitionEnabled(transitionId: string): boolean {
    const inputPlaces = this.getInputPlaces(transitionId);
    if (inputPlaces.length === 0) {
      return false;
    }
    return inputPlaces.every(place => this.getTokens(place.id) > 0);
  }

  getEnabledTransitions(): Transition[] {
    return this.getTransitions().filter(t => this.isTransitionEnabled(t.id));
  }

  fireTransition(transitionId: string): Marking | null {
    if (!this.isTransitionEnabled(transitionId)) {
      return null;
    }

    const inputPlaces = this.getInputPlaces(transitionId);
    const outputPlaces = this.getOutputPlaces(transitionId);

    for (const place of inputPlaces) {
      this.setTokens(place.id, this.getTokens(place.id) - 1);
    }

    for (const place of outputPlaces) {
      this.setTokens(place.id, this.getTokens(place.id) + 1);
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

  addArc(sourceId: string, targetId: string): Arc {
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    this.cy.add({
      group: 'edges',
      data: { id, type: 'arc', source: sourceId, target: targetId },
    });

    return { id, source: sourceId, target: targetId };
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
