export type Marking = Record<string, number>;

export interface Place {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export interface Transition {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export interface Arc {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface IPetriNet {
  getPlaces: () => Place[];
  getTransitions: () => Transition[];
  getArcs: () => Arc[];

  getMarking: () => Marking;
  setMarking: (marking: Marking) => void;
  getTokens: (placeId: string) => number;
  setTokens: (placeId: string, count: number) => void;

  getInputPlaces: (transitionId: string) => Place[];
  getOutputPlaces: (transitionId: string) => Place[];

  isTransitionEnabled: (transitionId: string) => boolean;
  getEnabledTransitions: () => Transition[];
  fireTransition: (transitionId: string) => Marking | null;

  addPlace: (x: number, y: number, label?: string) => Place;
  addTransition: (x: number, y: number, label?: string) => Transition;
  addArc: (sourceId: string, targetId: string, weight?: number) => Arc;
  removeElement: (id: string) => void;
}
