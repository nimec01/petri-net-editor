export type EditorMode = 'select' | 'place' | 'transition' | 'arc' | 'token' | 'delete' | 'fire';

export type LayoutType = 'circle' | 'dagre' | 'grid';

export type ElementType = 'place' | 'transition' | 'arc';

export interface PetriNetElementData {
  id: string;
  type: ElementType;
  label: string;
  tokens?: number;
  weight?: number;
  source?: string;
  target?: string;
  x?: number;
  y?: number;
}

export interface PetriNetState {
  elements: PetriNetElementData[];
  formatVersion?: number;
  title?: string;
}

export interface Command {
  type: 'add' | 'delete' | 'modify';
  elementData: PetriNetElementData;
  previousData?: PetriNetElementData;
}

export interface FiringHistoryEntry {
  id: number;
  transitionId: string;
  transitionLabel: string;
  markingBefore: Record<string, number>;
  markingAfter: Record<string, number>;
}
