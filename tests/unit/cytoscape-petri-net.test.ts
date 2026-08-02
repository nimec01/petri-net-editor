import { describe, expect, it } from 'vitest';
import { createCytoscapePetriNet } from '../helpers/cytoscape-net';

function buildTransferNet(tokens = 1) {
  const { net, ids } = createCytoscapePetriNet(
    [{ name: 'p1', tokens }, { name: 'p2' }],
    ['t1'],
    [
      { from: 'p1', to: 't1' },
      { from: 't1', to: 'p2' },
    ],
  );
  return {
    net,
    p1: ids.get('p1')!,
    p2: ids.get('p2')!,
    t1: ids.get('t1')!,
  };
}

describe('cytoscape petri net (IPetriNet implementation)', () => {
  it('exposes places, transitions and arcs', () => {
    const { net, p1, p2, t1 } = buildTransferNet(1);

    expect(net.getPlaces().map(place => place.id)).toEqual([p1, p2]);
    expect(net.getPlaces().map(place => place.label)).toEqual(['p1', 'p2']);
    expect(net.getTransitions()).toEqual([{ id: t1, label: 't1', position: { x: 0, y: 0 } }]);

    const arcs = net.getArcs();
    expect(arcs).toHaveLength(2);
    expect(arcs[0]).toMatchObject({ source: p1, target: t1, weight: 1 });
    expect(arcs[1]).toMatchObject({ source: t1, target: p2, weight: 1 });
  });

  it('reports node positions', () => {
    const { net, cy } = createCytoscapePetriNet([{ name: 'p1' }], [], []);
    cy.add({ group: 'nodes', data: { id: 'px', type: 'place', label: 'Px' }, position: { x: 5, y: 6 } });
    cy.add({ group: 'nodes', data: { id: 'px-inner', parent: 'px', tokens: 0 }, position: { x: 5, y: 6 } });

    const px = net.getPlaces().find(place => place.label === 'Px')!;
    expect(px.position).toEqual({ x: 5, y: 6 });
  });

  it('reads the marking from the inner token nodes', () => {
    const { net, p1, p2 } = buildTransferNet(1);

    expect(net.getMarking()).toEqual({ [p1]: 1, [p2]: 0 });
  });

  it('returns zero tokens for unknown places', () => {
    const { net, p1 } = buildTransferNet(1);

    expect(net.getTokens(p1)).toBe(1);
    expect(net.getTokens('missing')).toBe(0);
  });

  it('setTokens works through wrapper and inner ids and clamps negatives', () => {
    const { net, p1, p2 } = buildTransferNet(1);

    net.setTokens(p2, 5);
    expect(net.getTokens(p2)).toBe(5);

    net.setTokens(`${p1}-inner`, 7);
    expect(net.getTokens(p1)).toBe(7);

    net.setTokens(p2, -3);
    expect(net.getTokens(p2)).toBe(0);

    expect(() => net.setTokens('missing', 5)).not.toThrow();
  });

  it('setMarking updates the given places', () => {
    const { net, p1, p2 } = buildTransferNet(1);

    net.setMarking({ [p2]: 3 });

    expect(net.getTokens(p1)).toBe(1);
    expect(net.getTokens(p2)).toBe(3);
  });

  it('computes pre and post markings keyed by place id', () => {
    const { net, p1, p2, t1 } = buildTransferNet(1);

    expect(net.getPreMarking(t1)).toEqual({ [p1]: 1 });
    expect(net.getPostMarking(t1)).toEqual({ [p2]: 1 });
  });

  it('aggregates weights of parallel arcs in the pre marking', () => {
    const { net, ids } = createCytoscapePetriNet(
      [{ name: 'p1', tokens: 3 }],
      ['t1'],
      [
        { from: 'p1', to: 't1', weight: 2 },
        { from: 'p1', to: 't1', weight: 1 },
      ],
    );
    const p1 = ids.get('p1')!;
    const t1 = ids.get('t1')!;

    expect(net.getPreMarking(t1)).toEqual({ [p1]: 3 });
  });

  it('ignores arcs whose source or target is a transition in pre/post markings', () => {
    const { net, ids } = createCytoscapePetriNet(
      [{ name: 'p1', tokens: 1 }, { name: 'p2' }],
      ['t1', 't2'],
      [
        { from: 't1', to: 't2' },
        { from: 'p1', to: 't1' },
        { from: 't1', to: 'p2' },
      ],
    );
    const t1 = ids.get('t1')!;
    const t2 = ids.get('t2')!;
    const p1 = ids.get('p1')!;

    expect(net.getPreMarking(t2)).toEqual({});
    expect(net.getPostMarking(t2)).toEqual({});
    expect(net.getPreMarking(t1)).toEqual({ [p1]: 1 });
  });

  it('does not enable a transition without input arcs', () => {
    const { net, ids } = createCytoscapePetriNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 't1', to: 'p1' }],
    );
    const t1 = ids.get('t1')!;

    expect(net.isTransitionEnabled(t1)).toBe(false);
  });

  it('only enables a transition when tokens satisfy the arc weights', () => {
    const { net, ids } = createCytoscapePetriNet(
      [{ name: 'p1', tokens: 1 }],
      ['t1'],
      [{ from: 'p1', to: 't1', weight: 2 }],
    );
    const p1 = ids.get('p1')!;
    const t1 = ids.get('t1')!;

    expect(net.isTransitionEnabled(t1)).toBe(false);
    net.setTokens(p1, 2);
    expect(net.isTransitionEnabled(t1)).toBe(true);
  });

  it('getEnabledTransitions only returns enabled transitions', () => {
    const { net, ids } = createCytoscapePetriNet(
      [{ name: 'p1', tokens: 1 }, { name: 'q' }, { name: 'r' }],
      ['t1', 't2'],
      [
        { from: 'p1', to: 't1' },
        { from: 'p1', to: 't2' },
        { from: 't1', to: 'q' },
        { from: 't2', to: 'r' },
      ],
    );
    const t1 = ids.get('t1')!;
    const t2 = ids.get('t2')!;

    expect(net.getEnabledTransitions().map(transition => transition.id)).toEqual([t1, t2]);
  });

  it('returns the input and output places of a transition', () => {
    const { net, p1, p2, t1 } = buildTransferNet(1);

    expect(net.getInputPlaces(t1).map(place => place.id)).toEqual([p1]);
    expect(net.getInputPlaces(t1).map(place => place.label)).toEqual(['p1']);
    expect(net.getOutputPlaces(t1).map(place => place.id)).toEqual([p2]);
    expect(net.getInputPlaces('missing')).toEqual([]);
  });

  it('refuses to fire a disabled transition', () => {
    const { net, t1 } = buildTransferNet(0);
    const before = net.getMarking();

    expect(net.fireTransition(t1)).toBeNull();
    expect(net.getMarking()).toEqual(before);
  });

  it('fires an enabled transition and returns the new marking', () => {
    const { net, p1, p2, t1 } = buildTransferNet(1);

    const marking = net.fireTransition(t1);

    expect(marking).toEqual({ [p1]: 0, [p2]: 1 });
    expect(net.getTokens(p1)).toBe(0);
    expect(net.getTokens(p2)).toBe(1);
  });

  it('consumes and produces the exact weighted token counts', () => {
    const { net, ids } = createCytoscapePetriNet(
      [{ name: 'p1', tokens: 4 }, { name: 'p2' }],
      ['t1'],
      [
        { from: 'p1', to: 't1', weight: 2 },
        { from: 't1', to: 'p2', weight: 3 },
      ],
    );
    const p1 = ids.get('p1')!;
    const p2 = ids.get('p2')!;
    const t1 = ids.get('t1')!;

    net.fireTransition(t1);

    expect(net.getTokens(p1)).toBe(2);
    expect(net.getTokens(p2)).toBe(3);
  });

  it('addPlace creates a place wrapper with an inner token node', () => {
    const { net, cy } = createCytoscapePetriNet([], [], []);

    const place = net.addPlace(10, 20, 'custom');

    expect(place).toMatchObject({ label: 'custom', position: { x: 10, y: 20 } });
    expect(net.getPlaces().map(p => p.id)).toEqual([place.id]);
    expect(net.getTokens(place.id)).toBe(0);
    expect(cy.getElementById(place.id).children().length).toBe(1);
  });

  it('addPlace generates default labels', () => {
    const { net } = createCytoscapePetriNet([], [], []);

    const p1 = net.addPlace(0, 0);
    const p2 = net.addPlace(0, 0);

    expect(p1.label).toBe('P1');
    expect(p2.label).toBe('P2');
  });

  it('addTransition creates a transition node', () => {
    const { net } = createCytoscapePetriNet([], [], []);

    const t1 = net.addTransition(5, 6, 'custom');
    const t2 = net.addTransition(0, 0);

    expect(t1).toMatchObject({ label: 'custom', position: { x: 5, y: 6 } });
    expect(t2.label).toBe('T2');
    expect(net.getTransitions().map(transition => transition.id)).toEqual([t1.id, t2.id]);
  });

  it('addArc defaults non-positive weights to one', () => {
    const { net, p1, p2 } = buildTransferNet(1);

    const withWeight = net.addArc(p1, p2, 2);
    expect(withWeight).toMatchObject({ source: p1, target: p2, weight: 2 });

    expect(net.addArc(p1, p2).weight).toBe(1);
    expect(net.addArc(p1, p2, 0).weight).toBe(1);
    expect(net.addArc(p1, p2, -5).weight).toBe(1);
  });

  it('removeElement removes a place and its incident arcs', () => {
    const { net, p1 } = buildTransferNet(1);

    net.removeElement(p1);

    expect(net.getPlaces().map(place => place.id)).not.toContain(p1);
    expect(net.getArcs()).toHaveLength(1);
    expect(net.getMarking()).not.toHaveProperty(p1);
  });

  it('removeElement removes a transition and its incident arcs', () => {
    const { net, t1, p1, p2 } = buildTransferNet(1);

    net.removeElement(t1);

    expect(net.getTransitions()).toHaveLength(0);
    expect(net.getArcs()).toHaveLength(0);
    expect(net.getPlaces().map(place => place.id)).toEqual([p1, p2]);
  });

  it('removeElement removes an arc', () => {
    const { net } = buildTransferNet(1);
    const arcId = net.getArcs()[0]!.id;

    net.removeElement(arcId);

    expect(net.getArcs()).toHaveLength(1);
  });
});
