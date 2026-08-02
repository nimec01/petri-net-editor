import { describe, expect, it } from 'vitest';
import { analyzePetriNet, normalizeLimit } from '~/utils/petri-net-analysis';
import { DEFAULT_REACHABILITY_LIMIT } from '~/utils/reachability-graph';
import { buildNet, placeId, transitionId } from '../helpers/build-net';

describe('normalizeLimit', () => {
  it('keeps a positive integer as is', () => {
    expect(normalizeLimit(42)).toBe(42);
  });

  it('floors decimal values', () => {
    expect(normalizeLimit(2.9)).toBe(2);
  });

  it('falls back for zero and negative values', () => {
    expect(normalizeLimit(0)).toBe(DEFAULT_REACHABILITY_LIMIT);
    expect(normalizeLimit(-5)).toBe(DEFAULT_REACHABILITY_LIMIT);
  });

  it('falls back for NaN and Infinity', () => {
    expect(normalizeLimit(Number.NaN)).toBe(DEFAULT_REACHABILITY_LIMIT);
    expect(normalizeLimit(Number.POSITIVE_INFINITY)).toBe(DEFAULT_REACHABILITY_LIMIT);
  });

  it('uses the provided fallback', () => {
    expect(normalizeLimit(0, 10)).toBe(10);
    expect(normalizeLimit(Number.NaN, 10)).toBe(10);
  });
});

describe('analyzePetriNet', () => {
  it('analyzes an empty net', () => {
    const net = buildNet([], [], []);
    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(0);
    expect(analysis.complete).toBe(true);
    expect(analysis.liveness).toEqual({ transitions: [], allLive: false });
    expect(analysis.deadlock).toEqual({ deadlocks: [], exists: false });
    expect(analysis.safeness.allPlacesSafe).toBe(false);
    expect(analysis.safeness.weights).toEqual({ arcs: [], allSmall: true });
    expect(analysis.boundedness.bound).toBe(0);
    expect(analysis.boundedness.provenUnbounded).toBe(false);
    expect(analysis.boundedness.witness).toBeNull();
    expect(analysis.reachability.found).toBe(false);
  });

  it('analyzes a transfer net', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );
    const p1 = placeId(net, 'p1');
    const p2 = placeId(net, 'p2');
    const t1 = transitionId(net, 't1');

    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(2);
    expect(analysis.complete).toBe(true);
    expect(analysis.liveness.transitions).toEqual([{ id: t1, label: 't1', enabled: true, live: false }]);
    expect(analysis.liveness.allLive).toBe(false);
    expect(analysis.deadlock.exists).toBe(true);
    expect(analysis.deadlock.deadlocks).toEqual([{
      nodeId: 1,
      marking: { [p1]: 0, [p2]: 1 },
      path: [{ id: t1, label: 't1' }],
    }]);
    expect(analysis.safeness.places).toEqual([
      { id: p1, label: 'p1', maxTokens: 1, safe: true },
      { id: p2, label: 'p2', maxTokens: 1, safe: true },
    ]);
    expect(analysis.safeness.allPlacesSafe).toBe(true);
    expect(analysis.safeness.weights.allSmall).toBe(true);
    expect(analysis.boundedness.bound).toBe(1);
    expect(analysis.boundedness.provenUnbounded).toBe(false);
  });

  it('finds reachable and unreachable target markings', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );
    const p1 = placeId(net, 'p1');
    const p2 = placeId(net, 'p2');
    const t1 = transitionId(net, 't1');

    const initial = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p1]: 1 });
    expect(initial.reachability.found).toBe(true);
    expect(initial.reachability.nodeId).toBe(0);
    expect(initial.reachability.path).toEqual([]);

    const afterFiring = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p2]: 1 });
    expect(afterFiring.reachability.found).toBe(true);
    expect(afterFiring.reachability.nodeId).toBe(1);
    expect(afterFiring.reachability.path).toEqual([{ id: t1, label: 't1' }]);

    const impossible = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p2]: 2 });
    expect(impossible.reachability.found).toBe(false);
    expect(impossible.reachability.nodeId).toBeNull();
    expect(impossible.reachability.path).toEqual([]);
  });

  it('treats zero-valued and missing place entries as equal in targets', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );
    const p1 = placeId(net, 'p1');

    const analysis = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p1]: 1, missing: 0 });

    expect(analysis.reachability.found).toBe(true);
  });

  it('analyzes a net that is initially a deadlock', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 0 }, { name: 'p2' }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p2' }],
    );
    const p1 = placeId(net, 'p1');
    const p2 = placeId(net, 'p2');

    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(1);
    expect(analysis.deadlock.exists).toBe(true);
    expect(analysis.deadlock.deadlocks).toEqual([{ nodeId: 0, marking: { [p1]: 0, [p2]: 0 }, path: [] }]);
    expect(analysis.liveness.transitions[0]!.enabled).toBe(false);
    expect(analysis.liveness.transitions[0]!.live).toBe(false);
  });

  it('analyzes a self-loop net as live, safe and bounded', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p1' }],
    );
    const t1 = transitionId(net, 't1');

    const analysis = analyzePetriNet(net);

    expect(analysis.liveness.transitions).toEqual([{ id: t1, label: 't1', enabled: true, live: true }]);
    expect(analysis.liveness.allLive).toBe(true);
    expect(analysis.deadlock.exists).toBe(false);
    expect(analysis.safeness.allPlacesSafe).toBe(true);
    expect(analysis.boundedness.provenUnbounded).toBe(false);
    expect(analysis.boundedness.bound).toBe(1);
    expect(analysis.reachability.found).toBe(false);
  });

  it('detects unboundedness and reports a dominance witness', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 'p1', to: 't1' }, { from: 't1', to: 'p1', weight: 2 }],
    );
    const p1 = placeId(net, 'p1');
    const t1 = transitionId(net, 't1');

    const analysis = analyzePetriNet(net, 5);

    expect(analysis.limit).toBe(5);
    expect(analysis.nodeCount).toBe(5);
    expect(analysis.complete).toBe(false);
    expect(analysis.boundedness.provenUnbounded).toBe(true);
    expect(analysis.boundedness.bound).toBe(Number.POSITIVE_INFINITY);
    expect(analysis.boundedness.places).toEqual([{ id: p1, label: 'p1', maxTokens: 5, bounded: false }]);
    expect(analysis.boundedness.witness).toMatchObject({
      smaller: { nodeId: 0, marking: { [p1]: 1 } },
      larger: { nodeId: 1, marking: { [p1]: 2 } },
      increasedPlaceIds: [p1],
    });
    expect(analysis.liveness.allLive).toBe(true);

    const reachable = analyzePetriNet(net, 5, { [p1]: 3 });
    expect(reachable.reachability.found).toBe(true);
    expect(reachable.reachability.path).toEqual([{ id: t1, label: 't1' }, { id: t1, label: 't1' }]);
  });

  it('analyzes weighted arcs', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 3 }, { name: 'p2' }],
      ['t1'],
      [
        { from: 'p1', to: 't1', weight: 2 },
        { from: 't1', to: 'p2', weight: 1 },
      ],
    );
    const p1 = placeId(net, 'p1');
    const p2 = placeId(net, 'p2');
    const t1 = transitionId(net, 't1');

    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(2);
    expect(analysis.safeness.places.find(place => place.id === p1)!.maxTokens).toBe(3);
    expect(analysis.safeness.places.find(place => place.id === p1)!.safe).toBe(false);
    expect(analysis.safeness.allPlacesSafe).toBe(false);
    expect(analysis.safeness.weights).toEqual({
      arcs: [
        { id: expect.any(String), sourceLabel: 'p1', targetLabel: 't1', weight: 2 },
        { id: expect.any(String), sourceLabel: 't1', targetLabel: 'p2', weight: 1 },
      ],
      allSmall: false,
    });
    expect(analysis.boundedness.bound).toBe(3);

    const reachable = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p1]: 1, [p2]: 1 });
    expect(reachable.reachability.found).toBe(true);
    expect(reachable.reachability.path).toEqual([{ id: t1, label: 't1' }]);
  });

  it('analyzes a choice net', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'q' }, { name: 'r' }],
      ['t1', 't2'],
      [
        { from: 'p1', to: 't1' },
        { from: 'p1', to: 't2' },
        { from: 't1', to: 'q' },
        { from: 't2', to: 'r' },
      ],
    );
    const q = placeId(net, 'q');
    const t1 = transitionId(net, 't1');

    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(3);
    expect(analysis.complete).toBe(true);
    expect(analysis.liveness.transitions).toEqual([
      { id: t1, label: 't1', enabled: true, live: false },
      { id: transitionId(net, 't2'), label: 't2', enabled: true, live: false },
    ]);
    expect(analysis.liveness.allLive).toBe(false);
    expect(analysis.deadlock.deadlocks).toHaveLength(2);

    const reachable = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [q]: 1 });
    expect(reachable.reachability.found).toBe(true);
    expect(reachable.reachability.path).toEqual([{ id: t1, label: 't1' }]);
  });

  it('analyzes a sequential net and reconstructs multi-step paths', () => {
    const net = buildNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }, { name: 'p3' }],
      ['t1', 't2'],
      [
        { from: 'p1', to: 't1' },
        { from: 't1', to: 'p2' },
        { from: 'p2', to: 't2' },
        { from: 't2', to: 'p3' },
      ],
    );
    const p2 = placeId(net, 'p2');
    const p3 = placeId(net, 'p3');
    const t1 = transitionId(net, 't1');
    const t2 = transitionId(net, 't2');

    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(3);

    const mid = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p2]: 1 });
    expect(mid.reachability.found).toBe(true);
    expect(mid.reachability.path).toEqual([{ id: t1, label: 't1' }]);

    const end = analyzePetriNet(net, DEFAULT_REACHABILITY_LIMIT, { [p3]: 1 });
    expect(end.reachability.found).toBe(true);
    expect(end.reachability.path).toEqual([{ id: t1, label: 't1' }, { id: t2, label: 't2' }]);
  });

  it('analyzes a net with an isolated place and no transitions', () => {
    const net = buildNet([{ name: 'p1', tokens: 2 }], [], []);
    const p1 = placeId(net, 'p1');

    const analysis = analyzePetriNet(net);

    expect(analysis.nodeCount).toBe(1);
    expect(analysis.complete).toBe(true);
    expect(analysis.deadlock.exists).toBe(true);
    expect(analysis.liveness.allLive).toBe(false);
    expect(analysis.safeness.places).toEqual([{ id: p1, label: 'p1', maxTokens: 2, safe: false }]);
    expect(analysis.safeness.allPlacesSafe).toBe(false);
    expect(analysis.boundedness.bound).toBe(2);
    expect(analysis.boundedness.provenUnbounded).toBe(false);
  });
});
