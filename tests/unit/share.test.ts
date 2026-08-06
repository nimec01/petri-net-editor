import type { PetriNetState } from '~/types/petri-net';
import { describe, expect, it } from 'vitest';
import { decodeState, encodeState, parseNetState } from '~/utils/share';

const sampleState: PetriNetState = {
  formatVersion: 1,
  elements: [
    { id: 'p1', type: 'place', label: 'P1', tokens: 2, x: 10, y: 20 },
    { id: 't1', type: 'transition', label: 'T1', x: 50, y: 20 },
    { id: 'a1', type: 'arc', label: '', source: 'p1', target: 't1' },
  ],
};

describe('parseNetState', () => {
  it('accepts a raw PetriNetState body', () => {
    expect(parseNetState(sampleState)).toEqual(sampleState);
  });

  it('accepts a body wrapping the net in a "net" field', () => {
    expect(parseNetState({ net: sampleState })).toEqual(sampleState);
  });

  it('accepts a JSON string body', () => {
    expect(parseNetState(JSON.stringify(sampleState))).toEqual(sampleState);
  });

  it('accepts a JSON string that wraps the net (FormData "net" field)', () => {
    expect(parseNetState(JSON.stringify({ net: sampleState }))).toEqual(sampleState);
  });

  it('returns null for an unparseable JSON string', () => {
    expect(parseNetState('not json')).toBeNull();
  });

  it('returns null when elements is missing', () => {
    expect(parseNetState({})).toBeNull();
    expect(parseNetState({ net: { formatVersion: 1 } })).toBeNull();
  });

  it('returns null when elements is not an array', () => {
    expect(parseNetState({ elements: 'p1' })).toBeNull();
  });

  it('returns null for non-object bodies', () => {
    expect(parseNetState(null)).toBeNull();
    expect(parseNetState(undefined)).toBeNull();
    expect(parseNetState(42)).toBeNull();
    expect(parseNetState([sampleState])).toBeNull();
  });
});

describe('encodeState / decodeState', () => {
  it('round-trips a state', () => {
    expect(decodeState(encodeState(sampleState))).toEqual(sampleState);
  });
});
