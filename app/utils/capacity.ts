import type { PetriNetState } from '~/types/petri-net';
import type { Marking, Place } from '~/types/petri-net-core';

export const UNBOUNDED_CAPACITY = -1;

export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function placeCapacityError(capacity: number | undefined, tokens: number): string | null {
  if (capacity === undefined || capacity === UNBOUNDED_CAPACITY)
    return null;
  if (!isNonNegativeInteger(capacity))
    return 'Capacity must be a non-negative integer.';
  if (tokens > capacity)
    return 'Tokens exceed this place’s capacity.';
  return null;
}

export function isEnabledAt(places: Place[], marking: Marking, pre: Marking, post: Marking): boolean {
  if ((Object.keys(pre).length === 0 && Object.keys(post).length === 0)
    || !places.every(place => !placeCapacityError(place.capacity, marking[place.id] ?? 0))) {
    return false;
  }
  if (!Object.entries(pre).every(([id, weight]) => (marking[id] ?? 0) >= weight))
    return false;
  return places.every(place => place.capacity === undefined || place.capacity === UNBOUNDED_CAPACITY
    || (isNonNegativeInteger(place.capacity)
      && (marking[place.id] ?? 0) - (pre[place.id] ?? 0) + (post[place.id] ?? 0) <= place.capacity));
}

export function importCapacity(value: unknown, label: string, warnings: string[]): number | undefined {
  if (isNonNegativeInteger(value))
    return value;
  warnings.push(`Invalid capacity for place "${label}" was dropped; the place is unbounded.`);
  return undefined;
}

export function normalizeImportedCapacities(state: PetriNetState, warnings: string[]): PetriNetState {
  return {
    ...state,
    elements: state.elements.map((element) => {
      if (element.type !== 'place' || element.capacity === undefined)
        return element;
      const capacity = importCapacity(element.capacity, element.label || element.id, warnings);
      if (capacity === undefined) {
        const { capacity: _capacity, ...rest } = element;
        return rest;
      }
      return element;
    }),
  };
}

export function validateMarkings(state: PetriNetState): void {
  for (const element of state.elements) {
    if (element.type === 'place' && element.tokens !== undefined && !isNonNegativeInteger(element.tokens))
      throw new Error(`Invalid marking for place "${element.label || element.id}": expected a non-negative integer.`);
  }
}
