import type { Core } from 'cytoscape';
import type { FiringHistoryEntry, PetriNetState } from '../app/types/petri-net';
import type { IPetriNet } from '../app/types/petri-net-core';

declare global {
  interface Window {
    __PETRI_NET_DEBUG__?: {
      cy: { value: Core | null };
      petriNet: { value: IPetriNet | null };
      addPlace: (x: number, y: number) => string;
      addTransition: (x: number, y: number) => string;
      addArc: (source: string, target: string, weight?: number) => string;
      setTokens: (id: string, tokens: number) => void;
      zoomToFit: () => void;
      exportToJson: () => PetriNetState;
      firingHistory: { value: FiringHistoryEntry[] };
      autoFiring: { value: boolean };
      undoStack: { value: unknown[] };
      redoStack: { value: unknown[] };
    };
  }
}

export {};
