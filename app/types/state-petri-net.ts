import type { PetriNetState } from '~/types/petri-net';
import type { Arc, IPetriNet, Marking, Place, Transition } from '~/types/petri-net-core';

export class StatePetriNet implements IPetriNet {
  private places: Place[];
  private transitions: Transition[];
  private arcs: Arc[];
  private marking: Marking;

  constructor(state: PetriNetState) {
    this.places = [];
    this.transitions = [];
    this.arcs = [];
    this.marking = {};

    for (const el of state.elements) {
      if (el.type === 'place') {
        this.places.push({ id: el.id, label: el.label, position: { x: el.x ?? 0, y: el.y ?? 0 } });
        this.marking[el.id] = el.tokens ?? 0;
      } else if (el.type === 'transition') {
        this.transitions.push({ id: el.id, label: el.label, position: { x: el.x ?? 0, y: el.y ?? 0 } });
      } else if (el.type === 'arc') {
        this.arcs.push({ id: el.id, source: el.source!, target: el.target!, weight: el.weight ?? 1 });
      }
    }
  }

  getPlaces(): Place[] {
    return this.places;
  }

  getTransitions(): Transition[] {
    return this.transitions;
  }

  getArcs(): Arc[] {
    return this.arcs;
  }

  getMarking(): Marking {
    return { ...this.marking };
  }

  setMarking(marking: Marking): void {
    this.marking = { ...marking };
  }

  getTokens(placeId: string): number {
    return this.marking[placeId] ?? 0;
  }

  setTokens(placeId: string, count: number): void {
    this.marking[placeId] = Math.max(0, count);
  }

  getInputPlaces(transitionId: string): Place[] {
    return this.arcs
      .filter(a => a.target === transitionId)
      .map(a => this.places.find(p => p.id === a.source))
      .filter((p): p is Place => p !== undefined);
  }

  getOutputPlaces(transitionId: string): Place[] {
    return this.arcs
      .filter(a => a.source === transitionId)
      .map(a => this.places.find(p => p.id === a.target))
      .filter((p): p is Place => p !== undefined);
  }

  getPreMarking(transitionId: string): Marking {
    const marking: Marking = {};
    for (const arc of this.arcs) {
      if (arc.target === transitionId) {
        marking[arc.source] = (marking[arc.source] || 0) + arc.weight;
      }
    }
    return marking;
  }

  getPostMarking(transitionId: string): Marking {
    const marking: Marking = {};
    for (const arc of this.arcs) {
      if (arc.source === transitionId) {
        marking[arc.target] = (marking[arc.target] || 0) + arc.weight;
      }
    }
    return marking;
  }

  isTransitionEnabled(transitionId: string): boolean {
    const pre = this.getPreMarking(transitionId);
    return Object.keys(pre).length > 0
      && Object.entries(pre).every(([placeId, weight]) => (this.marking[placeId] ?? 0) >= weight);
  }

  getEnabledTransitions(): Transition[] {
    return this.transitions.filter(t => this.isTransitionEnabled(t.id));
  }

  fireTransition(transitionId: string): Marking | null {
    if (!this.isTransitionEnabled(transitionId)) {
      return null;
    }
    const pre = this.getPreMarking(transitionId);
    const post = this.getPostMarking(transitionId);
    for (const [placeId, weight] of Object.entries(pre)) {
      this.marking[placeId] = (this.marking[placeId] ?? 0) - weight;
    }
    for (const [placeId, weight] of Object.entries(post)) {
      this.marking[placeId] = (this.marking[placeId] ?? 0) + weight;
    }
    return this.getMarking();
  }

  addPlace(_x: number, _y: number, _label?: string): Place {
    throw new Error('StatePetriNet is read-only');
  }

  addTransition(_x: number, _y: number, _label?: string): Transition {
    throw new Error('StatePetriNet is read-only');
  }

  addArc(_sourceId: string, _targetId: string, _weight?: number): Arc {
    throw new Error('StatePetriNet is read-only');
  }

  removeElement(_id: string): void {
    throw new Error('StatePetriNet is read-only');
  }
}
