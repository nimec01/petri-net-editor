export type EditorMode = 'select' | 'place' | 'transition' | 'arc' | 'token' | 'delete';

export type ElementType = 'place' | 'transition' | 'arc';

export interface PetriNetElementData {
  id: string;
  type: ElementType;
  label: string;
  tokens?: number;
  source?: string;
  target?: string;
  x?: number;
  y?: number;
}

export interface PetriNetState {
  elements: PetriNetElementData[];
}

export interface Command {
  type: 'add' | 'delete' | 'modify';
  elementData: PetriNetElementData;
  previousData?: PetriNetElementData;
}
