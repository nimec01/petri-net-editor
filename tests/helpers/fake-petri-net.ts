import type { Arc, IPetriNet, Marking, Place, Transition } from '~/types/petri-net-core';

interface PlaceRecord {
  id: string;
  label: string;
  position: { x: number; y: number };
  tokens: number;
}

interface TransitionRecord {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export class FakePetriNet implements IPetriNet {
  private placeRecords = new Map<string, PlaceRecord>();
  private transitionRecords = new Map<string, TransitionRecord>();
  private arcRecords: Arc[] = [];
  private sequence = 1;

  private nextId(): string {
    return `n${this.sequence++}`;
  }

  getPlaces(): Place[] {
    return [...this.placeRecords.values()].map(({ id, label, position }) => ({ id, label, position }));
  }

  getTransitions(): Transition[] {
    return [...this.transitionRecords.values()].map(({ id, label, position }) => ({ id, label, position }));
  }

  getArcs(): Arc[] {
    return this.arcRecords.map(arc => ({ ...arc }));
  }

  getMarking(): Marking {
    const marking: Marking = {};
    for (const place of this.placeRecords.values()) {
      marking[place.id] = place.tokens;
    }
    return marking;
  }

  setMarking(marking: Marking): void {
    for (const [placeId, count] of Object.entries(marking)) {
      const place = this.placeRecords.get(placeId);
      if (place) {
        place.tokens = Math.max(0, Math.floor(count));
      }
    }
  }

  getTokens(placeId: string): number {
    return this.placeRecords.get(placeId)?.tokens ?? 0;
  }

  setTokens(placeId: string, count: number): void {
    const place = this.placeRecords.get(placeId);
    if (place) {
      place.tokens = Math.max(0, Math.floor(count));
    }
  }

  getInputPlaces(transitionId: string): Place[] {
    return this.arcRecords
      .filter(arc => arc.target === transitionId && this.placeRecords.has(arc.source))
      .map(arc => this.toPlace(this.placeRecords.get(arc.source)!));
  }

  getOutputPlaces(transitionId: string): Place[] {
    return this.arcRecords
      .filter(arc => arc.source === transitionId && this.placeRecords.has(arc.target))
      .map(arc => this.toPlace(this.placeRecords.get(arc.target)!));
  }

  getPreMarking(transitionId: string): Marking {
    const marking: Marking = {};
    for (const arc of this.arcRecords) {
      if (arc.target === transitionId && this.placeRecords.has(arc.source)) {
        marking[arc.source] = (marking[arc.source] || 0) + arc.weight;
      }
    }
    return marking;
  }

  getPostMarking(transitionId: string): Marking {
    const marking: Marking = {};
    for (const arc of this.arcRecords) {
      if (arc.source === transitionId && this.placeRecords.has(arc.target)) {
        marking[arc.target] = (marking[arc.target] || 0) + arc.weight;
      }
    }
    return marking;
  }

  isTransitionEnabled(transitionId: string): boolean {
    const pre = this.getPreMarking(transitionId);
    if (Object.keys(pre).length === 0) {
      return false;
    }
    return Object.entries(pre).every(([placeId, weight]) => this.getTokens(placeId) >= weight);
  }

  getEnabledTransitions(): Transition[] {
    return this.getTransitions().filter(transition => this.isTransitionEnabled(transition.id));
  }

  fireTransition(transitionId: string): Marking | null {
    if (!this.isTransitionEnabled(transitionId)) {
      return null;
    }
    for (const [placeId, weight] of Object.entries(this.getPreMarking(transitionId))) {
      this.setTokens(placeId, this.getTokens(placeId) - weight);
    }
    for (const [placeId, weight] of Object.entries(this.getPostMarking(transitionId))) {
      this.setTokens(placeId, this.getTokens(placeId) + weight);
    }
    return this.getMarking();
  }

  addPlace(x: number, y: number, label?: string): Place {
    const id = this.nextId();
    const placeLabel = label ?? `P${this.placeRecords.size + 1}`;
    const record: PlaceRecord = { id, label: placeLabel, position: { x, y }, tokens: 0 };
    this.placeRecords.set(id, record);
    return this.toPlace(record);
  }

  addTransition(x: number, y: number, label?: string): Transition {
    const id = this.nextId();
    const transitionLabel = label ?? `T${this.transitionRecords.size + 1}`;
    const record: TransitionRecord = { id, label: transitionLabel, position: { x, y } };
    this.transitionRecords.set(id, record);
    return { id, label: transitionLabel, position: { x, y } };
  }

  addArc(sourceId: string, targetId: string, weight?: number): Arc {
    const arc: Arc = {
      id: `a${this.sequence++}`,
      source: sourceId,
      target: targetId,
      weight: weight && weight > 0 ? weight : 1,
    };
    this.arcRecords.push(arc);
    return { ...arc };
  }

  removeElement(id: string): void {
    const removedPlace = this.placeRecords.delete(id);
    const removedTransition = this.transitionRecords.delete(id);
    if (removedPlace || removedTransition) {
      this.arcRecords = this.arcRecords.filter(arc => arc.source !== id && arc.target !== id);
    }
  }

  private toPlace(record: PlaceRecord): Place {
    return { id: record.id, label: record.label, position: record.position };
  }
}
